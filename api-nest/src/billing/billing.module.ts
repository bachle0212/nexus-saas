import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { SubscriptionPlan, Payment, User } from '../entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, Payment, User]), AuthModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
