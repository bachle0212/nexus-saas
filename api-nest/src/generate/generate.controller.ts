import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GenerateService } from './generate.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { TierThrottleGuard } from '../common/tier-throttle.guard';
import { ThrottleTier } from '../common/throttle.decorator';

@ApiTags('Generate')
@ApiBearerAuth()
@Controller('api')
export class GenerateController {
  constructor(private generateService: GenerateService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, TierThrottleGuard)
  @ThrottleTier('generate')
  @ApiOperation({ summary: 'Generate an AI image (costs 5 credits)' })
  generate(
    @Req() req,
    @Body()
    body: {
      prompt: string;
      width?: number;
      height?: number;
      seed?: number;
      character_id?: number;
    },
  ) {
    return this.generateService.generateImage(req.user, body);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get recent 10 generations (studio preview)' })
  getHistory(@Req() req) {
    return this.generateService.getHistory(req.user);
  }

  @Get('resources/generations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all generations with pagination & search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search by prompt' })
  getUserGenerations(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
  ) {
    return this.generateService.getUserGenerations(req.user, +page, +limit, q);
  }

  @Delete('resources/generations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a generation by ID' })
  deleteGeneration(@Req() req, @Param('id') id: string) {
    return this.generateService.deleteGeneration(req.user, +id);
  }
}
