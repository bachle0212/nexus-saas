import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { VideoGeneration, User } from '../entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([VideoGeneration, User]), AuthModule],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
