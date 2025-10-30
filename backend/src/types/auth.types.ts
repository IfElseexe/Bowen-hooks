export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: any;
    token: string;
    refresh_token?: string;
  };
}

export interface VerifyEmailRequest {
  token: string;
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}