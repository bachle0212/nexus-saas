import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Product, Order, OrderItem, User } from '../entities';
import { STRIPE_SECRET_KEY, FRONTEND_URL } from '../common/config';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getProducts() {
    return this.productRepo.find();
  }

  async createOrder(
    user: User,
    dto: { product_id: number; quantity: number; shipping_address: string },
  ) {
    const product = await this.productRepo.findOne({ where: { id: dto.product_id } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.inventory < dto.quantity)
      throw new BadRequestException('Not enough inventory');

    const total = product.price * dto.quantity;

    try {
      const order = this.orderRepo.create({
        user_id: user.id,
        total_amount: total,
        shipping_address: dto.shipping_address,
        status: 'pending',
      });
      await this.orderRepo.save(order);

      const item = this.orderItemRepo.create({
        order_id: order.id,
        product_id: product.id,
        quantity: dto.quantity,
        price_at_time: product.price,
      });
      await this.orderItemRepo.save(item);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: product.name },
              unit_amount: product.price * 100,
            },
            quantity: dto.quantity,
          },
        ],
        mode: 'payment',
        success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true&type=order&order_id=${order.id}`,
        cancel_url: `${FRONTEND_URL}/dashboard?canceled=true`,
        client_reference_id: String(user.id),
      });
      return { checkout_url: session.url };
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  async verifyOrder(user: User, sessionId: string, orderId: number) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // SECURITY: verify session belongs to this user (set at checkout creation)
      const sessionUserId = session.client_reference_id ?? session.metadata?.user_id;
      if (!sessionUserId || sessionUserId !== String(user.id)) {
        throw new ForbiddenException('Session does not belong to this account');
      }

      if (session.payment_status === 'paid') {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });

        // SECURITY: verify order belongs to this user
        if (!order || order.user_id !== user.id) {
          throw new ForbiddenException('Order does not belong to this account');
        }

        if (order.status === 'pending') {
          order.status = 'paid';
          const items = await this.orderItemRepo.find({ where: { order_id: order.id } });
          for (const i of items) {
            const p = await this.productRepo.findOne({ where: { id: i.product_id } });
            if (p) {
              p.inventory -= i.quantity;
              await this.productRepo.save(p);
            }
          }
          await this.orderRepo.save(order);
        }
        return { message: 'Order paid successfully!' };
      }
      return { message: 'Payment not completed' };
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new InternalServerErrorException(e.message);
    }
  }

  async getUserOrders(user: User) {
    const orders = await this.orderRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
    const res = [];
    for (const o of orders) {
      const items = await this.orderItemRepo.find({ where: { order_id: o.id } });
      const itemDetails = [];
      for (const i of items) {
        const p = await this.productRepo.findOne({ where: { id: i.product_id } });
        itemDetails.push({
          product_name: p?.name || 'Unknown',
          quantity: i.quantity,
          price: i.price_at_time,
        });
      }
      res.push({
        id: o.id,
        total: o.total_amount,
        status: o.status,
        address: o.shipping_address,
        date: o.created_at,
        items: itemDetails,
      });
    }
    return res;
  }
}
