import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get user usage dashboard (charts, stats)' })
  getUserDashboard(@Req() req) {
    return this.analyticsService.getUserDashboard(req.user);
  }

  @Get('admin')
  @ApiOperation({ summary: '[Admin] Platform-wide KPIs and analytics' })
  getAdminDashboard(@Req() req) {
    return this.analyticsService.getAdminDashboard(req.user);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: '[Admin] View audit log timeline' })
  getAuditLogs(@Req() req, @Query('page') page = '1', @Query('limit') limit = '50') {
    return this.analyticsService.getAuditLogs(req.user, +page, +limit);
  }
}
