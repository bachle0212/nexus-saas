import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { SubscriptionPlan, Payment, User } from '../entities';
import { PlanCreateDto, CreditTopUpDto } from './billing.dto';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL } from '../common/config';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const CREDIT_PACKAGES = [
  { id: 'credits_100', credits: 100, price_usd: 5, label: '100 Credits' },
  { id: 'credits_500', credits: 500, price_usd: 20, label: '500 Credits' },
  { id: 'credits_1000', credits: 1000, price_usd: 35, label: '1000 Credits' },
];

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getPlans() {
    return this.planRepo.find();
  }

  getCreditPackages() {
    return CREDIT_PACKAGES;
  }

  private checkAdmin(user: User) {
    const perms = user.permissions ? user.permissions.split(',') : [];
    if (!perms.includes('roles:manage')) {
      throw new ForbiddenException('Admin only');
    }
  }

  async createPlan(user: User, dto: PlanCreateDto) {
    this.checkAdmin(user);
    const plan = this.planRepo.create(dto);
    await this.planRepo.save(plan);
    return plan;
  }

  async updatePlan(user: User, id: number, dto: PlanCreateDto) {
    this.checkAdmin(user);
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    Object.assign(plan, dto);
    await this.planRepo.save(plan);
    return plan;
  }

  async deletePlan(user: User, id: number) {
    this.checkAdmin(user);
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.planRepo.remove(plan);
    return { message: 'Plan deleted successfully' };
  }

  async subscribe(user: User, planId: number) {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Nexus ${plan.name} Plan` },
            unit_amount: plan.price_usd * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true&type=subscription&plan_id=${plan.id}`,
        cancel_url: `${FRONTEND_URL}/dashboard?canceled=true`,
        client_reference_id: String(user.id),
        metadata: { type: 'subscription', plan_id: String(plan.id), user_id: String(user.id) },
      });
      return { checkout_url: session.url };
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  async buyCredits(user: User, dto: CreditTopUpDto) {
    const pkg = CREDIT_PACKAGES.find(p => p.id === dto.package_id);
    if (!pkg) throw new BadRequestException('Invalid credit package');

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Nexus ${pkg.label}` },
            unit_amount: pkg.price_usd * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true&type=credits&package_id=${pkg.id}`,
        cancel_url: `${FRONTEND_URL}/dashboard?canceled=true`,
        client_reference_id: String(user.id),
        metadata: { type: 'credits', package_id: pkg.id, credits: String(pkg.credits), user_id: String(user.id) },
      });
      return { checkout_url: session.url };
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  async verifySubscription(user: User, sessionId: string) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // SECURITY: verify the session belongs to this user (server-side binding set at checkout creation)
      const sessionUserId = session.client_reference_id ?? session.metadata?.user_id;
      if (!sessionUserId || sessionUserId !== String(user.id)) {
        throw new ForbiddenException('Session does not belong to this account');
      }

      if (session.payment_status !== 'paid') return { message: 'Payment not completed' };

      const existing = await this.paymentRepo.findOne({ where: { stripe_session_id: sessionId } });
      if (existing) return { message: 'Already processed' };

      // SECURITY: read plan_id from server-side metadata, never from client input
      const planId = parseInt(session.metadata?.plan_id ?? '0');
      const plan = await this.planRepo.findOne({ where: { id: planId } });
      if (plan) {
        user.plan = plan.name;
        user.credits += plan.monthly_credits;
        await this.paymentRepo.save(this.paymentRepo.create({
          user_id: user.id,
          amount: Math.round((session.amount_total ?? 0) / 100),
          credits_added: plan.monthly_credits,
          status: 'completed',
          stripe_session_id: sessionId,
          description: `${plan.name} Plan subscription`,
        }));
        await this.userRepo.save(user);
      }
      return { message: 'Payment verified and plan upgraded!' };
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new InternalServerErrorException(e.message);
    }
  }

  async verifyCredits(user: User, sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // SECURITY: verify the session belongs to this user
    const sessionUserId = session.client_reference_id ?? session.metadata?.user_id;
    if (!sessionUserId || sessionUserId !== String(user.id)) {
      throw new ForbiddenException('Session does not belong to this account');
    }

    if (session.payment_status !== 'paid') return { message: 'Payment not completed' };

    const existing = await this.paymentRepo.findOne({ where: { stripe_session_id: sessionId } });
    if (existing) return { message: 'Already processed' };

    // SECURITY: read package from server-side metadata, ignore any client-supplied package_id
    const pkgId = session.metadata?.package_id;
    const pkg = CREDIT_PACKAGES.find(p => p.id === pkgId);
    if (!pkg) throw new BadRequestException('Invalid or missing package in session metadata');

    user.credits += pkg.credits;
    await this.paymentRepo.save(this.paymentRepo.create({
      user_id: user.id,
      amount: Math.round((session.amount_total ?? 0) / 100),
      credits_added: pkg.credits,
      status: 'completed',
      stripe_session_id: sessionId,
      description: `Credit top-up: ${pkg.label}`,
    }));
    await this.userRepo.save(user);
    return { message: `${pkg.credits} credits added!`, remaining_credits: user.credits };
  }

  async getBillingHistory(user: User) {
    return this.paymentRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      this.logger.error(`Webhook signature verification failed: ${e.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.processCompletedSession(session);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.warn(`Payment failed for customer: ${invoice.customer}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCanceled(sub);
        break;
      }
    }

    return { received: true };
  }

  private async processCompletedSession(session: Stripe.Checkout.Session) {
    if (session.payment_status !== 'paid') return;

    const existing = await this.paymentRepo.findOne({
      where: { stripe_session_id: session.id },
    });
    if (existing) return;

    const userId = parseInt(session.metadata?.user_id ?? session.client_reference_id ?? '0');
    if (!userId) return;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const type = session.metadata?.type;

    if (type === 'subscription') {
      const planId = parseInt(session.metadata?.plan_id ?? '0');
      const plan = await this.planRepo.findOne({ where: { id: planId } });
      if (plan) {
        user.plan = plan.name;
        user.credits += plan.monthly_credits;
        await this.paymentRepo.save(this.paymentRepo.create({
          user_id: userId,
          amount: Math.round((session.amount_total ?? 0) / 100),
          credits_added: plan.monthly_credits,
          status: 'completed',
          stripe_session_id: session.id,
          description: `${plan.name} Plan subscription`,
        }));
      }
    } else if (type === 'credits') {
      const credits = parseInt(session.metadata?.credits ?? '0');
      const pkg = CREDIT_PACKAGES.find(p => p.id === session.metadata?.package_id);
      if (credits > 0) {
        user.credits += credits;
        await this.paymentRepo.save(this.paymentRepo.create({
          user_id: userId,
          amount: Math.round((session.amount_total ?? 0) / 100),
          credits_added: credits,
          status: 'completed',
          stripe_session_id: session.id,
          description: `Credit top-up: ${pkg?.label ?? credits + ' credits'}`,
        }));
      }
    }

    await this.userRepo.save(user);
    this.logger.log(`Processed checkout.session.completed for user ${userId}`);
  }

  private async handleSubscriptionCanceled(sub: Stripe.Subscription) {
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const user = await this.userRepo.findOne({ where: { stripe_customer_id: customerId } });
    if (user) {
      user.plan = 'Free';
      await this.userRepo.save(user);
      this.logger.log(`User ${user.id} downgraded to Free (subscription canceled)`);
    }
  }
}
