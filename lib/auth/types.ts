import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  kyc_status: "not_started" | "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  emailConfirmed: boolean;
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface AuthError {
  error: string;
  details?: string;
}

export type OAuthProvider = "google" | "apple" | "github";

export interface OAuthResponse {
  url: string;
  provider: OAuthProvider;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
}

export interface ProfileUpdateData {
  name?: string;
  kyc_status?: "not_started" | "pending" | "approved" | "rejected";
}
