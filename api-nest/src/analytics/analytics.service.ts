import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, Generation, VideoGeneration, Script, Payment, AuditLog } from '../entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Generation) private genRepo: Repository<Generation>,
    @InjectRepository(VideoGeneration) private videoRepo: Repository<VideoGeneration>,
    @InjectRepository(Script) private scriptRepo: Repository<Script>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async getUserDashboard(user: User) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalImages, totalVideos, totalScripts, paymentsThisMonth] = await Promise.all([
      this.genRepo.count({ where: { user_id: user.id } }),
      this.videoRepo.count({ where: { user_id: user.id } }),
      this.scriptRepo.count({ where: { user_id: user.id } }),
      this.paymentRepo.find({
        where: { user_id: user.id, created_at: Between(thirtyDaysAgo, now) as any },
        order: { created_at: 'DESC' },
      }),
    ]);

    // Daily generation counts for last 7 days
    const recentGens = await this.genRepo.find({
      where: { user_id: user.id, created_at: Between(sevenDaysAgo, now) as any },
      order: { created_at: 'ASC' },
    });

    const dailyCounts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyCounts[d.toISOString().split('T')[0]] = 0;
    }
    recentGens.forEach(g => {
      const day = new Date(g.created_at).toISOString().split('T')[0];
      if (dailyCounts[day] !== undefined) dailyCounts[day]++;
    });

    const creditsSpentThisMonth = paymentsThisMonth
      .filter(p => p.credits_added < 0)
      .reduce((sum, p) => sum + Math.abs(p.credits_added), 0);

    return {
      stats: {
        total_images: totalImages,
        total_videos: totalVideos,
        total_scripts: totalScripts,
        credits_remaining: user.credits,
        credits_spent_month: creditsSpentThisMonth,
        current_plan: user.plan,
      },
      chart: {
        labels: Object.keys(dailyCounts),
        data: Object.values(dailyCounts),
      },
      recent_payments: paymentsThisMonth.slice(0, 5),
    };
  }

  async getAdminDashboard(user: User) {
    const perms = user.permissions ? user.permissions.split(',') : [];
    if (!perms.includes('roles:manage')) throw new ForbiddenException('Admin only');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      totalGenerations,
      totalVideos,
      revenueRows,
      topUsers,
      planDistribution,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { created_at: Between(thirtyDaysAgo, now) as any } }),
      this.genRepo.count(),
      this.videoRepo.count(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.created_at >= :from', { from: thirtyDaysAgo })
        .getRawOne(),
      this.userRepo
        .createQueryBuilder('u')
        .leftJoin(Generation, 'g', 'g.user_id = u.id')
        .select(['u.id', 'u.email', 'u.plan', 'u.credits'])
        .addSelect('COUNT(g.id)', 'gen_count')
        .groupBy('u.id')
        .orderBy('gen_count', 'DESC')
        .limit(10)
        .getRawMany(),
      this.userRepo
        .createQueryBuilder('u')
        .select('u.plan', 'plan')
        .addSelect('COUNT(*)', 'count')
        .groupBy('u.plan')
        .getRawMany(),
    ]);

    return {
      kpis: {
        total_users: totalUsers,
        new_users_30d: newUsersThisMonth,
        total_generations: totalGenerations,
        total_videos: totalVideos,
        mrr_usd: parseFloat(revenueRows?.total ?? '0'),
      },
      top_users: topUsers,
      plan_distribution: planDistribution,
    };
  }

  async getAuditLogs(user: User, page = 1, limit = 50) {
    const perms = user.permissions ? user.permissions.split(',') : [];
    if (!perms.includes('roles:manage')) throw new ForbiddenException('Admin only');

    const [items, total] = await this.auditRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  async createAuditLog(userId: number, email: string, action: string, resource?: string, meta?: object, ip?: string) {
    const log = this.auditRepo.create({
      user_id: userId,
      user_email: email,
      action,
      resource,
      meta: meta ? JSON.stringify(meta) : null,
      ip_address: ip,
    });
    await this.auditRepo.save(log);
  }
}
