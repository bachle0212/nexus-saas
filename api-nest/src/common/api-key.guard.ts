import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Support both X-Nexus-API-Key header and Bearer token
    const apiKey =
      request.headers['x-nexus-api-key'] ||
      (request.headers.authorization?.startsWith('Bearer nx_')
        ? request.headers.authorization.slice(7)
        : null);

    if (!apiKey) throw new UnauthorizedException('API key required');

    const user = await this.userRepo.findOne({ where: { api_key: apiKey } });
    if (!user) throw new UnauthorizedException('Invalid API key');

    request.user = user;
    return true;
  }
}
