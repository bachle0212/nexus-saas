import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, Role } from '../entities';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UserUpdateDto,
} from './auth.dto';
import {
  SECRET_KEY,
  ACCESS_TOKEN_EXPIRE_MINUTES,
  REFRESH_TOKEN_EXPIRE_DAYS,
  FRONTEND_URL,
} from '../common/config';
import { EmailService } from '../common/email.service';
import { Response, Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private createAccessToken(userId: number): string {
    return this.jwtService.sign(
      { sub: String(userId) },
      { secret: SECRET_KEY, expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` },
    );
  }

  private createRefreshToken(userId: number): string {
    return this.jwtService.sign(
      { sub: String(userId) },
      { secret: SECRET_KEY, expiresIn: `${REFRESH_TOKEN_EXPIRE_DAYS}d` },
    );
  }

  private generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private setCookies(res: Response, refreshToken: string, csrfToken: string) {
    const maxAge = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax' as const,
      ...(isProduction ? { domain: '.bachdev.xyz' } : {}),
    };
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge,
    });
    res.cookie('csrf_token', csrfToken, { ...cookieOptions });
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const role = await this.roleRepo.findOne({ where: { name: 'user' } });
    const perms = role?.permissions || 'generate:image';

    const hashed = await bcrypt.hash(dto.password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = this.userRepo.create({
      email: dto.email,
      hashed_password: hashed,
      credits: 100,
      role: 'user',
      permissions: perms,
      email_verified: false,
      email_verify_token: verifyToken,
      api_key: 'nx_' + crypto.randomBytes(18).toString('base64url'),
    });
    await this.userRepo.save(user);

    await this.emailService.sendVerificationEmail(dto.email, verifyToken, FRONTEND_URL);

    return { message: 'Registration successful! Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({ where: { email_verify_token: token } });
    if (!user) throw new BadRequestException('Invalid or expired verification token');

    user.email_verified = true;
    user.email_verify_token = null;
    await this.userRepo.save(user);

    return { message: 'Email verified successfully! You can now log in.' };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.hashed_password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const role = await this.roleRepo.findOne({ where: { name: user.role } });
    if (role && role.permissions !== user.permissions) {
      user.permissions = role.permissions;
      await this.userRepo.save(user);
    }

    const accessToken = this.createAccessToken(user.id);
    const refreshToken = this.createRefreshToken(user.id);
    const csrfToken = this.generateCsrfToken();

    this.setCookies(res, refreshToken, csrfToken);

    const perms = user.permissions ? user.permissions.split(',') : [];
    return {
      access_token: accessToken,
      user: {
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        credits: user.credits,
        role: user.role,
        plan: user.plan,
        permissions: perms,
        email_verified: user.email_verified,
      },
    };
  }

  async getMe(user: User) {
    const perms = user.permissions ? user.permissions.split(',') : [];
    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      credits: user.credits,
      role: user.role,
      plan: user.plan,
      permissions: perms,
      email_verified: user.email_verified,
    };
  }

  async updateProfile(user: User, dto: UserUpdateDto) {
    if (dto.display_name !== undefined) user.display_name = dto.display_name;
    if (dto.avatar_url !== undefined) user.avatar_url = dto.avatar_url;
    await this.userRepo.save(user);
    return { message: 'Profile updated', display_name: user.display_name, avatar_url: user.avatar_url };
  }

  async changePassword(user: User, dto: ChangePasswordDto) {
    const valid = await bcrypt.compare(dto.current_password, user.hashed_password);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    user.hashed_password = await bcrypt.hash(dto.new_password, 12);
    await this.userRepo.save(user);
    return { message: 'Password changed successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const token = crypto.randomBytes(32).toString('hex');
    user.reset_password_token = token;
    user.reset_password_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepo.save(user);

    await this.emailService.sendPasswordResetEmail(user.email, token, FRONTEND_URL);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepo.findOne({
      where: { reset_password_token: dto.token },
    });

    if (!user || !user.reset_password_expires || user.reset_password_expires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.hashed_password = await bcrypt.hash(dto.new_password, 12);
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await this.userRepo.save(user);

    return { message: 'Password reset successfully. You can now log in.' };
  }

  async regenerateApiKey(user: User) {
    user.api_key = 'nx_' + crypto.randomBytes(18).toString('base64url');
    await this.userRepo.save(user);
    return { api_key: user.api_key };
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = (req as any).cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    try {
      const payload = this.jwtService.verify(refreshToken, { secret: SECRET_KEY });
      const userId = payload.sub;
      const newAccessToken = this.createAccessToken(parseInt(userId, 10));
      const newCsrfToken = this.generateCsrfToken();

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('csrf_token', newCsrfToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        ...(isProduction ? { domain: '.bachdev.xyz' } : {}),
      });

      return { access_token: newAccessToken };
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }
}
