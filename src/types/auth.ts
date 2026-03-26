export interface AuthUser {
  id?: string;
  email: string;
  name?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ requiresEmailVerification: boolean; email: string }>;
  verifySignupToken: (token: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
}
