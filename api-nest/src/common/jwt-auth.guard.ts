import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { SECRET_KEY } from './config';

// Skip CSRF for these paths
const CSRF_EXEMPT_PATHS = ['/api/auth/me', '/api/billing/plans'];

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];

    // CSRF check for state-changing methods (except exempt paths)
    const method = request.method;
    const path = request.path;
    if (
      ['POST', 'PUT', 'DELETE'].includes(method) &&
      !CSRF_EXEMPT_PATHS.some((p) => path.startsWith(p))
    ) {
      const headerCsrf = request.headers['x-csrf-token'];
      const cookieCsrf = request.cookies?.csrf_token;
      if (!headerCsrf || !cookieCsrf || headerCsrf !== cookieCsrf) {
        throw new ForbiddenException('CSRF token validation failed');
      }
    }

    try {
      const payload = this.jwtService.verify(token, { secret: SECRET_KEY });
      const userId = parseInt(payload.sub, 10);
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Could not validate credentials');
    }
  }
}
