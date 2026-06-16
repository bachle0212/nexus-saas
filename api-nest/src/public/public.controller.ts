import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { GenerateService } from '../generate/generate.service';
import { ApiKeyGuard } from '../common/api-key.guard';
import { TierThrottleGuard } from '../common/tier-throttle.guard';
import { ThrottleTier } from '../common/throttle.decorator';

@ApiTags('Public API')
@ApiSecurity('api-key')
@Controller('api/public')
export class PublicController {
  constructor(private generateService: GenerateService) {}

  @Get()
  @ApiOperation({ summary: 'Public API info & quota limits' })
  getInfo() {
    return {
      version: 'v1',
      docs: '/api/docs',
      endpoints: ['POST /api/public/generate'],
      rate_limits: {
        Free: '5 req/min',
        Pro: '60 req/min',
        Enterprise: 'Unlimited',
      },
      credit_cost: { generate_image: 5 },
    };
  }

  @Post('generate')
  @UseGuards(ApiKeyGuard, TierThrottleGuard)
  @ThrottleTier('generate')
  @ApiOperation({ summary: 'Generate an AI image via API key (costs 5 credits)' })
  @ApiResponse({ status: 200, description: 'Image generated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 402, description: 'Not enough credits' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded for your plan' })
  generate(
    @Req() req,
    @Body() body: {
      prompt: string;
      width?: number;
      height?: number;
      seed?: number;
    },
  ) {
    return this.generateService.generateImage(req.user, body);
  }
}
