jest.mock('../common/config', () => ({
  MINIO_ENDPOINT: 'http://localhost:9000',
  MINIO_PUBLIC_URL: 'http://localhost:9000',
  MINIO_ACCESS_KEY: 'test',
  MINIO_SECRET_KEY: 'test',
  MINIO_BUCKET: 'nexus-generations',
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn().mockResolvedValue({}) })),
  PutObjectCommand: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: Buffer.from('fake-image') }),
}));

// Spread real `fs` so TypeORM's path-scurry (glob dependency) can access
// fs.promises, fs.native, etc. Only stub out the methods video.service.ts uses.
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdtempSync: jest.fn().mockReturnValue('/tmp/nexus-video-test'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-video')),
  unlinkSync: jest.fn(),
  rmdirSync: jest.fn(),
}));

jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

// Spread real `util` so TypeORM's internal util usage (inspect, format, etc.) still works.
// Only override promisify so video.service's execFileAsync becomes a no-op mock.
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn().mockReturnValue(jest.fn().mockResolvedValue({ stdout: '', stderr: '' })),
}));

// uuid v14 is ESM-only — Jest (CommonJS mode) cannot parse it without mocking
jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid-1234') }));

import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from './video.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VideoGeneration, User } from '../entities';
import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';

const mockUser = {
  id: 1,
  email: 'user@nexus.ai',
  credits: 100,
  plan: 'Free',
};

const mockVideoRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  increment: jest.fn(),
};

const mockUserRepo = {
  save: jest.fn(),
  findOne: jest.fn(),
  increment: jest.fn(),
};

describe('VideoService', () => {
  let service: VideoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        { provide: getRepositoryToken(VideoGeneration), useValue: mockVideoRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
    jest.clearAllMocks();

    // Stub processVideoJob so it doesn't run real ffmpeg in tests
    jest.spyOn(service as any, 'processVideoJob').mockResolvedValue(undefined);
  });

  // ─── generateVideo ────────────────────────────────────────────────────────

  describe('generateVideo', () => {
    it('throws 402 Payment Required when user has fewer than 20 credits', async () => {
      const poorUser = { ...mockUser, credits: 10 };
      await expect(
        service.generateVideo(poorUser as any, { prompt: 'test video' }),
      ).rejects.toThrow(HttpException);
    });

    it('throws BadRequestException when neither prompt nor image_url provided', async () => {
      await expect(
        service.generateVideo(mockUser as any, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('deducts 20 credits immediately before job starts', async () => {
      const user = { ...mockUser, credits: 100 };
      mockVideoRepo.create.mockReturnValue({ id: 42, status: 'processing' });
      mockVideoRepo.save.mockResolvedValue({ id: 42, status: 'processing' });
      mockUserRepo.save.mockResolvedValue(user);

      await service.generateVideo(user as any, { prompt: 'test' });
      expect(user.credits).toBe(80);
      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ credits: 80 }));
    });

    it('returns job_id immediately without waiting for video processing', async () => {
      const user = { ...mockUser };
      mockVideoRepo.create.mockReturnValue({ id: 7, status: 'processing' });
      mockVideoRepo.save.mockResolvedValue({ id: 7, status: 'processing' });
      mockUserRepo.save.mockResolvedValue(user);

      const result = await service.generateVideo(user as any, { prompt: 'dragon' });

      expect(result).toHaveProperty('job_id', 7);
      expect(result.status).toBe('processing');
      expect(result.message).toContain('Poll');
    });

    it('fires processVideoJob without awaiting (non-blocking)', async () => {
      const user = { ...mockUser };
      mockVideoRepo.create.mockReturnValue({ id: 1, status: 'processing' });
      mockVideoRepo.save.mockResolvedValue({ id: 1, status: 'processing' });
      mockUserRepo.save.mockResolvedValue(user);

      await service.generateVideo(user as any, { prompt: 'test' });

      // processVideoJob was called (fire-and-forget) but we didn't await it
      expect((service as any).processVideoJob).toHaveBeenCalledTimes(1);
    });

    it('works with image_url instead of prompt', async () => {
      const user = { ...mockUser };
      mockVideoRepo.create.mockReturnValue({ id: 2, status: 'processing' });
      mockVideoRepo.save.mockResolvedValue({ id: 2, status: 'processing' });
      mockUserRepo.save.mockResolvedValue(user);

      const result = await service.generateVideo(user as any, { image_url: 'https://example.com/img.jpg' });
      expect(result).toHaveProperty('job_id');
    });
  });

  // ─── getVideoStatus ───────────────────────────────────────────────────────

  describe('getVideoStatus', () => {
    it('throws NotFoundException for non-existent job', async () => {
      mockVideoRepo.findOne.mockResolvedValue(null);
      await expect(service.getVideoStatus(mockUser as any, 999)).rejects.toThrow(NotFoundException);
    });

    it('returns status fields for existing job', async () => {
      const job = { id: 5, status: 'completed', result_url: 'https://cdn/v.mp4', prompt: 'test', created_at: new Date() };
      mockVideoRepo.findOne.mockResolvedValue(job);

      const result = await service.getVideoStatus(mockUser as any, 5);
      expect(result.id).toBe(5);
      expect(result.status).toBe('completed');
      expect(result.result_url).toBe('https://cdn/v.mp4');
    });

    it('returns processing status for in-progress job', async () => {
      const job = { id: 3, status: 'processing', result_url: null, prompt: 'test', created_at: new Date() };
      mockVideoRepo.findOne.mockResolvedValue(job);

      const result = await service.getVideoStatus(mockUser as any, 3);
      expect(result.status).toBe('processing');
      expect(result.result_url).toBeNull();
    });
  });

  // ─── getVideoHistory ──────────────────────────────────────────────────────

  describe('getVideoHistory', () => {
    it('returns all video jobs for the user', async () => {
      const jobs = [
        { id: 1, status: 'completed' },
        { id: 2, status: 'processing' },
      ];
      mockVideoRepo.find.mockResolvedValue(jobs);

      const result = await service.getVideoHistory(mockUser as any);
      expect(result).toHaveLength(2);
      expect(mockVideoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: mockUser.id } }),
      );
    });

    it('returns empty array when no videos', async () => {
      mockVideoRepo.find.mockResolvedValue([]);
      const result = await service.getVideoHistory(mockUser as any);
      expect(result).toEqual([]);
    });
  });
});
