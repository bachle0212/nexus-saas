import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, User } from '../entities';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async getNotifications(user: User) {
    const items = await this.notifRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
      take: 30,
    });
    const unread = items.filter(n => !n.is_read).length;
    return { items, unread };
  }

  async markAsRead(user: User, id: number) {
    await this.notifRepo.update({ id, user_id: user.id }, { is_read: true });
    return { message: 'Marked as read' };
  }

  async markAllRead(user: User) {
    await this.notifRepo.update({ user_id: user.id }, { is_read: true });
    return { message: 'All notifications marked as read' };
  }

  async create(userId: number, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string) {
    const notif = this.notifRepo.create({ user_id: userId, title, message, type, link });
    await this.notifRepo.save(notif);
    return notif;
  }

  async checkAndAlertLowCredits(user: User) {
    if (user.credits <= 20 && user.credits > 0) {
      const existing = await this.notifRepo.findOne({
        where: { user_id: user.id, type: 'warning', title: 'Credits running low' },
        order: { created_at: 'DESC' },
      });
      // Only notify once per day
      if (!existing || new Date(existing.created_at).getDate() !== new Date().getDate()) {
        await this.create(
          user.id,
          'Credits running low',
          `You have ${user.credits} credits left. Top up to keep generating content.`,
          'warning',
          '/dashboard#billing',
        );
      }
    }
  }
}
