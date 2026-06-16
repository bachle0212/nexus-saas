import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Generation, CharacterProfile, User } from '../entities';
import {
  MINIO_ENDPOINT,
  MINIO_PUBLIC_URL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
} from '../common/config';

const s3 = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

@Injectable()
export class GenerateService {
  constructor(
    @InjectRepository(Generation) private genRepo: Repository<Generation>,
    @InjectRepository(CharacterProfile) private charRepo: Repository<CharacterProfile>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async generateImage(
    user: User,
    dto: {
      prompt: string;
      width?: number;
      height?: number;
      seed?: number;
      character_id?: number;
    },
  ) {
    if (user.credits < 5) {
      throw new HttpException('Not enough credits', HttpStatus.PAYMENT_REQUIRED);
    }

    user.credits -= 5;

    let finalPrompt = dto.prompt;
    let finalSeed = dto.seed;

    if (dto.character_id) {
      const char = await this.charRepo.findOne({
        where: { id: dto.character_id, user_id: user.id },
      });
      if (char) {
        finalPrompt = `${char.prompt_injection}, ${dto.prompt}`;
        finalSeed = char.seed;
      }
    }

    const width = dto.width || 1024;
    const height = dto.height || 1024;
    const safePrompt = encodeURIComponent(finalPrompt);
    let pollinationsUrl = `https://image.pollinations.ai/prompt/${safePrompt}?nologo=true&width=${width}&height=${height}`;
    if (finalSeed != null) pollinationsUrl += `&seed=${finalSeed}`;

    let imgUrl = pollinationsUrl;
    try {
      const response = await axios.get(pollinationsUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      const imageData = Buffer.from(response.data);
      const fileName = `${user.id}/${uuidv4()}.jpg`;
      await s3.send(
        new PutObjectCommand({
          Bucket: MINIO_BUCKET,
          Key: fileName,
          Body: imageData,
          ContentType: 'image/jpeg',
        }),
      );
      imgUrl = `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${fileName}`;
    } catch (e) {
      console.error('Error fetching/uploading image:', e.message);
    }

    await this.userRepo.save(user);

    const gen = this.genRepo.create({
      user_id: user.id,
      prompt: finalPrompt,
      result_url: imgUrl,
      cost: 5,
      width,
      height,
    });
    await this.genRepo.save(gen);

    return { url: imgUrl, remaining_credits: user.credits };
  }

  async getHistory(user: User) {
    return this.genRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
      take: 10,
    });
  }

  async getUserGenerations(user: User, page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;
    const where: any = { user_id: user.id };
    if (q) where.prompt = Like(`%${q}%`);

    const [items, total] = await this.genRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async deleteGeneration(user: User, genId: number) {
    const gen = await this.genRepo.findOne({
      where: { id: genId, user_id: user.id },
    });
    if (!gen) throw new NotFoundException('Resource not found');
    await this.genRepo.remove(gen);
    return { message: 'Resource deleted' };
  }
}
