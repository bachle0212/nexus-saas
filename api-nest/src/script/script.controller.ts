import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ScriptService } from './script.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/scripts')
export class ScriptController {
  constructor(private scriptService: ScriptService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  generateScript(
    @Req() req,
    @Body() body: { topic: string; tone: string; length: string },
  ) {
    return this.scriptService.generateScript(req.user, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getScripts(@Req() req) {
    return this.scriptService.getScripts(req.user);
  }
}
