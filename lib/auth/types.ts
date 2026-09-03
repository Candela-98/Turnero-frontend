export type UserRole = "OWNER" | "ADMIN" | "RECEPTIONIST" | "STAFF" | "CUSTOMER";

export type AuthMeResponse = {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  businessId: number;
  businessName: string;
  businessSlug: string;
};

export type LoginWithGoogleRequest = {
  idToken: string;
};
