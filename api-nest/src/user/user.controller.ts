import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  @Get('credits')
  getCredits(@Req() req) {
    return { credits: req.user.credits };
  }
}
