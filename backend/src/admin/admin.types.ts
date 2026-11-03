export interface PublicAdmin {
  id: string;
  username: string;
}

export interface AdminAuthResult {
  admin: PublicAdmin;
  cookieValue: string;
  expiresAt: Date;
}
