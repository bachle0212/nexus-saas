import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Role } from '../entities';
import { EmailService } from '../common/email.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const mockUser = {
  id: 1,
  email: 'test@nexus.ai',
  hashed_password: bcrypt.hashSync('password123', 10),
  credits: 100,
  plan: 'Free',
  role: 'user',
  permissions: 'generate:image',
  email_verified: false,
  email_verify_token: 'abc123',
  api_key: 'nx_test_key',
};

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockRoleRepo = {
  findOne: jest.fn().mockResolvedValue({ name: 'user', permissions: 'generate:image' }),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockReturnValue({ sub: '1' }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and send verification email', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({ ...mockUser, id: undefined });
      mockUserRepo.save.mockResolvedValue(mockUser);

      const result = await service.register({ email: 'new@nexus.ai', password: 'password123' });

      expect(result.message).toContain('check your email');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('should throw if email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@nexus.ai', password: 'password123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepo.save.mockResolvedValue({});

      const result = await service.verifyEmail('abc123');
      expect(result.message).toContain('verified');
    });

    it('should throw with invalid token', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail('badtoken')).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should always return success message (prevents email enumeration)', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const result = await service.forgotPassword({ email: 'nonexistent@nexus.ai' });
      expect(result.message).toContain('If that email exists');
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should send reset email if user exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepo.save.mockResolvedValue({});

      const result = await service.forgotPassword({ email: 'test@nexus.ai' });
      expect(result.message).toContain('If that email exists');
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const expiry = new Date(Date.now() + 3600000);
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        reset_password_token: 'valid_token',
        reset_password_expires: expiry,
      });
      mockUserRepo.save.mockResolvedValue({});

      const result = await service.resetPassword({
        token: 'valid_token',
        new_password: 'newpass123',
      });
      expect(result.message).toContain('successfully');
    });

    it('should throw with expired token', async () => {
      const expiry = new Date(Date.now() - 1000);
      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        reset_password_expires: expiry,
      });

      await expect(
        service.resetPassword({ token: 'expired', new_password: 'newpass123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('regenerateApiKey', () => {
    it('should generate a new API key', async () => {
      const user = { ...mockUser };
      mockUserRepo.save.mockResolvedValue(user);
      const result = await service.regenerateApiKey(user as any);
      expect(result.api_key).toMatch(/^nx_/);
    });
  });
});
