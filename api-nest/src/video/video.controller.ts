import { Controller, Post, Get, Body, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@ApiTags('Video')
@ApiBearerAuth()
@Controller('api/video')
export class VideoController {
  constructor(private videoService: VideoService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start async video generation (returns job_id immediately)' })
  generate(@Req() req, @Body() body: { prompt?: string; image_url?: string }) {
    return this.videoService.generateVideo(req.user, body);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Poll video job status' })
  getStatus(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.videoService.getVideoStatus(req.user, id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get video generation history' })
  getHistory(@Req() req) {
    return this.videoService.getVideoHistory(req.user);
  }
}
