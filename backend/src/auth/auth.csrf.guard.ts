import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { getCorsOrigins } from '../cors-origins';

const CSRF_FORBIDDEN_MESSAGE = 'CSRF check failed';

type HeaderValue = string | string[] | undefined;

type CsrfRequest = {
  method?: string;
  headers?: Record<string, HeaderValue>;
};

function headerValue(value: HeaderValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

@Injectable()
export class AuthCsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CsrfRequest>();
    if (request.method !== 'POST') {
      return true;
    }

    const contentType = headerValue(request.headers?.['content-type']) ?? '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
      throw new ForbiddenException(CSRF_FORBIDDEN_MESSAGE);
    }

    const origin = headerValue(request.headers?.['origin']);
    if (origin && !getCorsOrigins().includes(origin)) {
      throw new ForbiddenException(CSRF_FORBIDDEN_MESSAGE);
    }

    return true;
  }
}
