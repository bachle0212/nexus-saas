import { Test, TestingModule } from '@nestjs/testing';
import { GenerateService } from './generate.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Generation, CharacterProfile, User } from '../entities';
import { HttpException } from '@nestjs/common';

const mockUser = {
  id: 1,
  email: 'test@nexus.ai',
  credits: 100,
  plan: 'Free',
};

const mockGenRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockCharRepo = {
  findOne: jest.fn().mockResolvedValue(null),
};

const mockUserRepo = {
  save: jest.fn(),
};

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: Buffer.from('fake-image') }),
}));

// Mock S3 client
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
}));

// uuid v14 is ESM-only — must mock for Jest CommonJS mode
jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid-5678') }));

describe('GenerateService', () => {
  let service: GenerateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateService,
        { provide: getRepositoryToken(Generation), useValue: mockGenRepo },
        { provide: getRepositoryToken(CharacterProfile), useValue: mockCharRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<GenerateService>(GenerateService);
    jest.clearAllMocks();
  });

  describe('generateImage', () => {
    it('should throw 402 when not enough credits', async () => {
      const poorUser = { ...mockUser, credits: 2 };
      await expect(
        service.generateImage(poorUser as any, { prompt: 'test' }),
      ).rejects.toThrow(HttpException);
    });

    it('should deduct 5 credits on success', async () => {
      const user = { ...mockUser, credits: 50 };
      mockGenRepo.create.mockReturnValue({});
      mockGenRepo.save.mockResolvedValue({});
      mockUserRepo.save.mockResolvedValue(user);

      await service.generateImage(user as any, { prompt: 'a dragon' });
      expect(user.credits).toBe(45);
    });
  });

  describe('getUserGenerations', () => {
    it('should return paginated results', async () => {
      mockGenRepo.findAndCount.mockResolvedValue([[{ id: 1 }, { id: 2 }], 2]);

      const result = await service.getUserGenerations(mockUser as any, 1, 20);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pages).toBe(1);
    });
  });

  describe('deleteGeneration', () => {
    it('should delete generation by owner', async () => {
      mockGenRepo.findOne.mockResolvedValue({ id: 1, user_id: 1 });
      mockGenRepo.remove.mockResolvedValue({});

      const result = await service.deleteGeneration(mockUser as any, 1);
      expect(result.message).toContain('deleted');
    });

    it('should throw NotFoundException for non-existent generation', async () => {
      mockGenRepo.findOne.mockResolvedValue(null);
      await expect(
        service.deleteGeneration(mockUser as any, 999),
      ).rejects.toThrow();
    });
  });
});
