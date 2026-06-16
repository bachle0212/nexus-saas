import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiKeyGuard } from './api-key.guard';
import { User } from '../entities';

const mockUser = { id: 1, email: 'dev@nexus.ai', api_key: 'nx_valid_key_1234567890' };

const mockUserRepo = {
  findOne: jest.fn(),
};

function makeContext(headers: Record<string, string>): ExecutionContext {
  const request: any = { headers, user: null };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    jest.clearAllMocks();
  });

  it('throws UnauthorizedException when no API key header is provided', async () => {
    const ctx = makeContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for invalid X-Nexus-API-Key header', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);
    const ctx = makeContext({ 'x-nexus-api-key': 'nx_invalid_key' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('passes and attaches user to request for valid X-Nexus-API-Key header', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    const request: any = { headers: { 'x-nexus-api-key': 'nx_valid_key_1234567890' }, user: null };
    const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as any;

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(request.user).toEqual(mockUser);
    expect(mockUserRepo.findOne).toHaveBeenCalledWith({
      where: { api_key: 'nx_valid_key_1234567890' },
    });
  });

  it('extracts API key from Bearer token when it starts with nx_', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    const request: any = {
      headers: { authorization: 'Bearer nx_valid_key_1234567890' },
      user: null,
    };
    const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as any;

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockUserRepo.findOne).toHaveBeenCalledWith({
      where: { api_key: 'nx_valid_key_1234567890' },
    });
  });

  it('does NOT extract API key from regular JWT Bearer token', async () => {
    // A real JWT starts with "eyJ..." not "nx_"
    const ctx = makeContext({ authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.payload.signature' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockUserRepo.findOne).not.toHaveBeenCalled();
  });

  it('X-Nexus-API-Key header takes precedence over Authorization', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    const request: any = {
      headers: {
        'x-nexus-api-key': 'nx_valid_key_1234567890',
        authorization: 'Bearer nx_other_key',
      },
      user: null,
    };
    const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as any;

    await guard.canActivate(ctx);

    // Should use the X-Nexus-API-Key header value
    expect(mockUserRepo.findOne).toHaveBeenCalledWith({
      where: { api_key: 'nx_valid_key_1234567890' },
    });
  });
});
