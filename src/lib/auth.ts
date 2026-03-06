import { SessionOptions } from "iron-session";

export const sessionOptions: SessionOptions = {
  password: "complex_password_at_least_32_characters_long_for_security_dextino",
  cookieName: "dexbuscas_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export interface SessionData {
  isLoggedIn?: boolean;
  username?: string;
}