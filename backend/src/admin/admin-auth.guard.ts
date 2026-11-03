import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { readAdminSessionId } from './admin.cookie';

type AuthedRequest = {
  headers?: { cookie?: string };
  admin?: { id: string; username: string };
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly adminAuth: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const cookieValue = readAdminSessionId(request.headers?.cookie);
    try {
      const session = await this.adminAuth.requireSession(cookieValue);
      request.admin = {
        id: session.admin.id,
        username: session.admin.username,
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
