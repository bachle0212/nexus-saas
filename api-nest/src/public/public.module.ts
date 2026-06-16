import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { GenerateModule } from '../generate/generate.module';
import { ApiKeyGuard } from '../common/api-key.guard';
import { User } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    GenerateModule,
  ],
  controllers: [PublicController],
  providers: [ApiKeyGuard],
})
export class PublicModule {}
