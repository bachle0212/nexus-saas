import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationController {
  constructor(private notifService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications (unread count + list)' })
  getNotifications(@Req() req) {
    return this.notifService.getNotifications(req.user);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Req() req, @Param('id') id: string) {
    return this.notifService.markAsRead(req.user, +id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@Req() req) {
    return this.notifService.markAllRead(req.user);
  }
}
