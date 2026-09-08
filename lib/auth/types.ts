export type UserRole = "OWNER";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
};

export type AuthBusiness = {
  id: number;
  name: string;
  slug: string;
  onboarding_status: string;
};

export type AuthSession = { user: AuthUser; business: AuthBusiness };

export type LoginWithGoogleRequest = { id_token: string };
