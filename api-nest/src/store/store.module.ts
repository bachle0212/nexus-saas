import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { Product, Order, OrderItem, User } from '../entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Order, OrderItem, User]), AuthModule],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}
