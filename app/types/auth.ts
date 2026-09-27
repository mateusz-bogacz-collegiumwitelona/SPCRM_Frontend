export interface LoginPayload {
  name: string;
  password: string;
}

export interface ResetPasswordPayload {
  userId: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ConfirmEmailPayload {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ConfirmEmailChangePayload {
  userId: string;
  token: string;
}

export interface User {
  userId: string;
  email: string;
  userName: string;
  roles: string[];
}
