import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/store')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get('products')
  getProducts() {
    return this.storeService.getProducts();
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  createOrder(
    @Req() req,
    @Body() body: { product_id: number; quantity: number; shipping_address: string },
  ) {
    return this.storeService.createOrder(req.user, body);
  }

  @Post('verify-order')
  @UseGuards(JwtAuthGuard)
  verifyOrder(
    @Req() req,
    @Query('session_id') sessionId: string,
    @Query('order_id') orderId: string,
  ) {
    return this.storeService.verifyOrder(req.user, sessionId, +orderId);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  getUserOrders(@Req() req) {
    return this.storeService.getUserOrders(req.user);
  }
}
