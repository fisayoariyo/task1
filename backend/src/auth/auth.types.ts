export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResult {
  user: PublicUser;
  cookieValue: string;
  expiresAt: Date;
}
