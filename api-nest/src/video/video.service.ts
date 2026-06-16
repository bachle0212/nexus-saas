import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { VideoGeneration, User } from '../entities';
import {
  MINIO_ENDPOINT, MINIO_PUBLIC_URL,
  MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET,
} from '../common/config';

const execFileAsync = promisify(execFile);

const s3 = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: { accessKeyId: MINIO_ACCESS_KEY, secretAccessKey: MINIO_SECRET_KEY },
  forcePathStyle: true,
});

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(VideoGeneration) private videoRepo: Repository<VideoGeneration>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async generateVideo(user: User, dto: { prompt?: string; image_url?: string }) {
    if (user.credits < 20) {
      throw new HttpException('Not enough credits', HttpStatus.PAYMENT_REQUIRED);
    }

    if (!dto.prompt && !dto.image_url) {
      throw new BadRequestException('Prompt or image_url required');
    }

    user.credits -= 20;
    await this.userRepo.save(user);

    const displayPrompt = dto.image_url
      ? `Image to Video: ${dto.image_url}`
      : dto.prompt;

    const gen = this.videoRepo.create({
      user_id: user.id,
      prompt: displayPrompt,
      status: 'processing',
      cost: 20,
    });
    await this.videoRepo.save(gen);

    // Fire off the heavy work WITHOUT awaiting — non-blocking response
    this.processVideoJob(gen.id, user, dto).catch(() => {});

    return { job_id: gen.id, status: 'processing', message: 'Video is being generated. Poll /api/video/:id/status for progress.' };
  }

  private async processVideoJob(jobId: number, user: User, dto: { prompt?: string; image_url?: string }) {
    const td = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-video-'));
    const imgPath = path.join(td, 'input.jpg');
    const vidPath = path.join(td, 'output.mp4');

    try {
      let imgUrl: string;
      if (dto.image_url) {
        imgUrl = dto.image_url;
      } else {
        const safePrompt = encodeURIComponent(dto.prompt!);
        imgUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=576&nologo=true`;
      }

      const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
      fs.writeFileSync(imgPath, Buffer.from(imgRes.data));

      await execFileAsync('ffmpeg', [
        '-y', '-loop', '1', '-i', imgPath,
        '-vf', "zoompan=z='min(zoom+0.0015,1.5)':d=100:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1024x576",
        '-c:v', 'libx264', '-t', '4', '-pix_fmt', 'yuv420p', '-crf', '25',
        vidPath,
      ], { timeout: 90000 });

      const videoData = fs.readFileSync(vidPath);
      const fileName = `videos/${user.id}/${uuidv4()}.mp4`;

      await s3.send(new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: fileName,
        Body: videoData,
        ContentType: 'video/mp4',
      }));

      const resUrl = `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${fileName}`;

      await this.videoRepo.update(jobId, { result_url: resUrl, status: 'completed' });
    } catch (err) {
      await this.videoRepo.update(jobId, { status: 'failed' });
      // Refund credits on failure
      await this.userRepo.increment({ id: user.id }, 'credits', 20);
    } finally {
      try { fs.unlinkSync(imgPath); } catch {}
      try { fs.unlinkSync(vidPath); } catch {}
      try { fs.rmdirSync(td); } catch {}
    }
  }

  async getVideoStatus(user: User, jobId: number) {
    const gen = await this.videoRepo.findOne({ where: { id: jobId, user_id: user.id } });
    if (!gen) throw new NotFoundException('Job not found');
    return {
      id: gen.id,
      status: gen.status,
      result_url: gen.result_url,
      prompt: gen.prompt,
      created_at: gen.created_at,
    };
  }

  async getVideoHistory(user: User) {
    return this.videoRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
  }
}
