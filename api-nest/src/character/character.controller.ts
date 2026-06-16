import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharacterProfile } from '../entities';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { NotFoundException } from '@nestjs/common';

@Controller('api/characters')
export class CharacterController {
  constructor(
    @InjectRepository(CharacterProfile)
    private charRepo: Repository<CharacterProfile>,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCharacters(@Req() req) {
    return this.charRepo.find({ where: { user_id: req.user.id } });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCharacter(
    @Req() req,
    @Body() body: { name: string; prompt_injection: string; seed: number },
  ) {
    const char = this.charRepo.create({
      user_id: req.user.id,
      name: body.name,
      prompt_injection: body.prompt_injection,
      seed: body.seed,
    });
    await this.charRepo.save(char);
    return { message: 'Character created', id: char.id };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteCharacter(@Req() req, @Param('id') id: string) {
    const char = await this.charRepo.findOne({
      where: { id: +id, user_id: req.user.id },
    });
    if (!char) throw new NotFoundException('Character not found');
    await this.charRepo.remove(char);
    return { message: 'Character deleted' };
  }
}
