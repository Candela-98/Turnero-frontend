import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { ApiError, apiFetch, type ApiRequestOptions } from "@/lib/api/client";
import { adaptCustomerSession, customerEndpoint, customerSessionRequest, type CustomerSession, type CustomerSessionDto } from "./customer-api";

type Status = "checking" | "authenticated" | "anonymous" | "signing-in" | "signing-out" | "error";
type Snapshot = { status: Status; session: CustomerSession | null; error: string | null; retry: "restore" | "logout"; refreshing: boolean };
const initial: Snapshot = { status: "checking", session: null, error: null, retry: "restore", refreshing: false };
const expired = (error: unknown) => error instanceof ApiError && error.status === 401;
function message(error: unknown, login = false) {
  if (error instanceof ApiError && error.status === 409) return "El negocio debe revisar el vínculo de tu cuenta. Contactá al negocio.";
  if (error instanceof ApiError && error.status === 403) return "No pudimos acceder a tu cuenta en este negocio. Podés reintentar o ingresar con otra cuenta.";
  if (login && expired(error)) return "No pudimos validar tu ingreso con Google. Intentá nuevamente.";
  return "No pudimos comprobar tu sesión. Revisá tu conexión y reintentá.";
}

// The customer cookie is shared by every business on this host. Finish an older
// auth mutation (including its Set-Cookie) before another view restores or signs in.
// This queue deliberately has no relationship to administrative authentication.
let pendingCustomerAuth: Promise<void> = Promise.resolve();
function serializeCustomerAuth<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingCustomerAuth.then(operation);
  pendingCustomerAuth = result.then(() => undefined, () => undefined);
  return result;
}

// One private cache per mounted business boundary; never uses the admin QueryClient.
export class CustomerSessionStore {
  readonly cache = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 300_000 } } });
  private snapshot: Snapshot = initial;
  private generation = 0;
  private controller = new AbortController();
  private listeners = new Set<() => void>();
  constructor(readonly slug: string) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => initial;
  private publish(next: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach(listener => listener());
  }
  private clearPrivate() {
    ++this.generation;
    this.controller.abort();
    this.controller = new AbortController();
    void this.cache.cancelQueries();
    this.cache.clear();
    return this.generation;
  }
  dispose = () => {
    this.clearPrivate();
    this.publish({ status: "checking", session: null, error: null, refreshing: false, retry: "restore" });
  };
  private anonymous(error: string | null = null) {
    this.clearPrivate();
    this.publish({ status: "anonymous", session: null, error, refreshing: false });
  }
  async restore() {
    const generation = this.clearPrivate();
    this.publish({ status: "checking", session: null, error: null, refreshing: false, retry: "restore" });
    try {
      await pendingCustomerAuth;
      if (generation !== this.generation) return;
      const session = await customerSessionRequest(this.slug, "me", { signal: this.controller.signal });
      if (generation === this.generation) this.publish({ status: "authenticated", session });
    } catch (error) {
      if (generation !== this.generation) return;
      if (expired(error)) this.anonymous();
      else this.publish({ status: "error", error: message(error) });
    }
  }
  async signIn(idToken: string) {
    if (["checking", "signing-in", "signing-out"].includes(this.snapshot.status) || this.snapshot.retry === "logout") return;
    const generation = this.clearPrivate();
    this.publish({ status: "signing-in", session: null, error: null, refreshing: false });
    try {
      const session = await serializeCustomerAuth(() => customerSessionRequest(this.slug, "google", {
        body: { id_token: idToken }, method: "POST",
      }));
      if (generation === this.generation) this.publish({ status: "authenticated", session });
    } catch (error) {
      if (generation === this.generation) this.publish({ status: "anonymous", error: message(error, true) });
    }
  }
  async signOut() {
    if (this.snapshot.status === "signing-out") return;
    const generation = this.clearPrivate();
    this.publish({ status: "signing-out", session: null, error: null, refreshing: false, retry: "logout" });
    try {
      // Do not abort auth mutations on unmount: a new view waits for their cookie effects.
      await serializeCustomerAuth(() => apiFetch<void>(customerEndpoint(this.slug, "auth/logout"), {
        method: "POST", cache: "no-store",
      }));
      if (generation === this.generation) {
        this.anonymous();
        this.publish({ retry: "restore" });
      }
    } catch {
      if (generation === this.generation) this.publish({ status: "error", error: "No pudimos cerrar la sesión del servidor. Reintentá el cierre.", retry: "logout" });
    }
  }
  async requestPrivate<T>(resource: string, options: ApiRequestOptions = {}): Promise<T> {
    if (this.snapshot.status !== "authenticated") throw new Error("Customer session required");
    const generation = this.generation;
    const signal = options.signal ? AbortSignal.any([this.controller.signal, options.signal]) : this.controller.signal;
    try {
      const result = await apiFetch<T>(customerEndpoint(this.slug, resource), { ...options, signal, cache: "no-store" });
      if (generation !== this.generation) throw new DOMException("Request superseded", "AbortError");
      return result;
    } catch (error) {
      if (generation === this.generation && expired(error)) this.anonymous("Tu sesión venció. Volvé a ingresar para continuar.");
      throw error;
    }
  }
  queryPrivate<T>(key: QueryKey, resource: string) {
    const customerId = this.snapshot.session?.customer.id;
    if (customerId === undefined) return Promise.reject(new Error("Customer session required"));
    return this.cache.fetchQuery({ queryKey: ["customer", this.slug, customerId, ...key],
      queryFn: ({ signal }) => this.requestPrivate<T>(resource, { signal }) });
  }
  async refresh() {
    if (this.snapshot.refreshing || this.snapshot.status !== "authenticated") return;
    const generation = this.generation;
    this.publish({ refreshing: true, error: null });
    try {
      // me is itself a private operation; later customer features use the same request boundary.
      const dto = await this.requestPrivate<CustomerSessionDto>("auth/me");
      const session = adaptCustomerSession(this.slug, dto);
      if (generation === this.generation && (session.customer.id !== this.snapshot.session?.customer.id || session.business.slug !== this.slug)) {
        this.anonymous("La cuenta cambió. Volvé a ingresar en este negocio.");
      } else if (generation === this.generation) {
        this.publish({ session });
      }
    } catch (error) {
      if (generation === this.generation) this.publish({ error: message(error) });
    } finally {
      if (generation === this.generation) this.publish({ refreshing: false });
    }
  }
}
