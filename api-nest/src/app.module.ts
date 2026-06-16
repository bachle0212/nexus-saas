import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  User, Role, SubscriptionPlan, Payment, Generation,
  CharacterProfile, VideoGeneration, Script, Product, Order, OrderItem,
  AuditLog, Notification,
} from './entities';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { StoreModule } from './store/store.module';
import { GenerateModule } from './generate/generate.module';
import { CharacterModule } from './character/character.module';
import { ScriptModule } from './script/script.module';
import { VideoModule } from './video/video.module';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationModule } from './notification/notification.module';
import { PublicModule } from './public/public.module';
import { DATABASE_URL } from './common/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: DATABASE_URL,
      entities: [
        User, Role, SubscriptionPlan, Payment, Generation,
        CharacterProfile, VideoGeneration, Script, Product, Order, OrderItem,
        AuditLog, Notification,
      ],
      synchronize: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    BillingModule,
    StoreModule,
    GenerateModule,
    CharacterModule,
    ScriptModule,
    VideoModule,
    AdminModule,
    UserModule,
    AnalyticsModule,
    NotificationModule,
    PublicModule,
  ],
})
export class AppModule {}
