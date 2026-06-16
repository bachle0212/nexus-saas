import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Script, User } from '../entities';
import { GROQ_API_KEY } from '../common/config';

@Injectable()
export class ScriptService {
  constructor(
    @InjectRepository(Script) private scriptRepo: Repository<Script>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async generateScript(
    user: User,
    dto: { topic: string; tone: string; length: string },
  ) {
    if (user.credits < 2) {
      throw new HttpException('Not enough credits', HttpStatus.PAYMENT_REQUIRED);
    }
    user.credits -= 2;

    const systemPrompt = `You are a professional scriptwriter. Write a ${dto.length} script about the topic provided by the user. The tone should be ${dto.tone}. Use formatting like [Scene] or [Narrator] to structure the output.`;

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Topic: ${dto.topic}` },
      ],
      temperature: 0.7,
      max_completion_tokens: 2048,
    };

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        payload,
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const resultText = response.data.choices[0].message.content;
      const script = this.scriptRepo.create({
        user_id: user.id,
        title: dto.topic,
        content: resultText,
      });
      await this.scriptRepo.save(script);
      await this.userRepo.save(user);

      return { content: resultText, remaining_credits: user.credits };
    } catch (e) {
      console.error('Groq API Error:', e.message);
      user.credits += 2;
      await this.userRepo.save(user);
      throw new InternalServerErrorException('Failed to generate script. Try again.');
    }
  }

  async getScripts(user: User) {
    return this.scriptRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
  }
}
