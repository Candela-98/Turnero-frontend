import { expect, test } from "@playwright/test";

const apiBaseUrl = "**/api/backend/api/v1";
const authGoogleUrl = `${apiBaseUrl}/auth/google`;
const authMeUrl = `${apiBaseUrl}/auth/me`;
const authLogoutUrl = `${apiBaseUrl}/auth/logout`;
const googleScriptUrl = "https://accounts.google.com/gsi/client";

function isMobileProject(projectName: string) {
  return projectName.startsWith("mobile");
}

const currentUser = {
  business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" },
};

async function mockGoogleIdentityButton(page: import("@playwright/test").Page) {
  await page.route(googleScriptUrl, async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `
        window.google = {
          accounts: {
            id: {
              initialize: function(options) {
                window.__turneroGoogleCallback = options.callback;
              },
              renderButton: function(parent, options) {
                var button = document.createElement("button");
                button.type = "button";
                button.textContent = "Continuar con Google";
                button.style.width = options.width + "px";
                button.style.height = "40px";
                button.onclick = function() {
                  window.__turneroGoogleCallback({ credential: "google-id-token" });
                };
                parent.appendChild(button);
              }
            }
          }
        };
      `,
    });
  });
}

test.describe("admin authentication", () => {
  test("shows a clean login when there is no session", async ({ page }) => {
    await page.route(authMeUrl, async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "UNAUTHORIZED",
          message: "Session token is required",
          status: 401,
        },
        status: 401,
      });
    });

    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
    await expect(page.getByText("Iniciá sesión para continuar")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Agenda" })).not.toBeVisible();
  });

  test("does not show an error alert while restoring an invalid or expired session", async ({ page }) => {
    await page.route(authMeUrl, async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "UNAUTHORIZED",
          message: "Invalid session",
          status: 401,
        },
        status: 401,
      });
    });

    await page.goto("/agenda");

    await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
    await expect(page.getByText("Si tu sesión venció")).not.toBeVisible();
  });

  test("keeps the Stitch login composition at every supported viewport", async ({ page }) => {
    await mockGoogleIdentityButton(page);
    await page.route(authMeUrl, async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "UNAUTHORIZED",
          message: "Session token is required",
          status: 401,
        },
        status: 401,
      });
    });

    await page.goto("/login");

    await expect(page.getByText("Barber Studio")).toBeVisible();
    await expect(page.getByText("Agenda premium")).toBeVisible();
    await expect(page.getByText("Al continuar aceptás las políticas del negocio.")).toBeVisible();
    await expect(page.getByRole("listitem")).toHaveText(["Agenda del día", "Clientes", "Servicios"]);
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  });

  test("shows an error alert after an explicit Google login fails", async ({ page }) => {
    await mockGoogleIdentityButton(page);
    await page.route(authMeUrl, (route) => route.fulfill({ contentType: "application/json", json: { message: "No session" }, status: 401 }));
    await page.route(authGoogleUrl, (route) => route.fulfill({ contentType: "application/json", json: { message: "Invalid Google identity" }, status: 401 }));

    await page.goto("/login");
    await page.getByRole("button", { name: "Continuar con Google" }).click();

    await expect(page.getByText("Iniciá sesión para continuar")).toBeVisible();
  });

  test("allows a valid admin to log in with Google and access the agenda", async ({
    page,
  }, testInfo) => {
    let authMeCalls = 0;

    await mockGoogleIdentityButton(page);

    await page.route(authGoogleUrl, async (route) => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({ id_token: "google-id-token" });

      await route.fulfill({
        contentType: "application/json",
        headers: {
          "Set-Cookie": "turnero_session=test-session; HttpOnly; Path=/",
        },
        json: currentUser,
        status: 200,
      });
    });

    await page.route(authMeUrl, async (route) => {
      authMeCalls += 1;

      if (authMeCalls === 1) {
        await route.fulfill({
          contentType: "application/json",
          json: {
            code: "UNAUTHORIZED",
            message: "Session token is required",
            status: 401,
          },
          status: 401,
        });
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        json: currentUser,
        status: 200,
      });
    });

    await page.goto("/login");

    await page.getByRole("button", { name: "Continuar con Google" }).click();

    if (isMobileProject(testInfo.project.name)) {
      await expect(page.getByText("Agenda de hoy")).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
    }

    await expect(page.getByRole("banner").getByTitle("Juan Perez")).toBeVisible();
  });

  test("shows access denied without clearing a forbidden session", async ({ page }) => {
    await page.route(authMeUrl, (route) => route.fulfill({ contentType: "application/json", json: { message: "Forbidden" }, status: 403 }));
    await page.goto("/agenda");
    await expect(page.getByText("Tu usuario no tiene acceso al panel administrativo")).toBeVisible();
  });

  test("offers retry after a network failure", async ({ page }, testInfo) => {
    let attempts = 0;
    await page.route(authMeUrl, async (route) => {
      attempts += 1;
      if (attempts === 1) { await route.abort("failed"); return; }
      await route.fulfill({ contentType: "application/json", json: currentUser, status: 200 });
    });
    await page.goto("/agenda");
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(isMobileProject(testInfo.project.name) ? page.getByText("Agenda de hoy") : page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  });

  test("logs out and returns to login even when logout reports an expired session", async ({ page }) => {
    await page.route(authMeUrl, (route) => route.fulfill({ contentType: "application/json", json: currentUser, status: 200 }));
    await page.route(authLogoutUrl, (route) => route.fulfill({ contentType: "application/json", json: { message: "Expired" }, status: 401 }));
    await page.goto("/agenda");
    await page.getByRole("button", { name: "Abrir menú de cuenta" }).click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
  });

  test("keeps administrative navigation reachable while sections are pending", async ({ page }, testInfo) => {
    await page.route(authMeUrl, (route) =>
      route.fulfill({ contentType: "application/json", json: currentUser, status: 200 }),
    );
    await page.goto("/agenda");

    if (isMobileProject(testInfo.project.name)) {
      await page.getByRole("link", { name: "Más" }).click();
      await expect(page).toHaveURL(/\/mas$/);
      await expect(page.getByRole("heading", { name: "Más opciones" })).toBeVisible();
      await page.getByRole("link", { name: /Servicios/ }).click();
    } else {
      await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Clientes" }).click();
    }

    await expect(page).toHaveURL(/\/(clientes|servicios)$/);
    await expect(page.getByText("Esta sección estará disponible próximamente.")).toBeVisible();
  });
});
