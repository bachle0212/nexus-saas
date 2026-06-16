import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  RawBodyRequest,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { PlanCreateDto, CreditTopUpDto } from './billing.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@ApiTags('Billing')
@Controller('api/billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans' })
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('credit-packages')
  @ApiOperation({ summary: 'List credit top-up packages' })
  getCreditPackages() {
    return this.billingService.getCreditPackages();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get billing history for current user' })
  getBillingHistory(@Req() req) {
    return this.billingService.getBillingHistory(req.user);
  }

  @Post('plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create subscription plan' })
  createPlan(@Req() req, @Body() dto: PlanCreateDto) {
    return this.billingService.createPlan(req.user, dto);
  }

  @Put('plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update subscription plan' })
  updatePlan(@Req() req, @Param('id') id: string, @Body() dto: PlanCreateDto) {
    return this.billingService.updatePlan(req.user, +id, dto);
  }

  @Delete('plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete subscription plan' })
  deletePlan(@Req() req, @Param('id') id: string) {
    return this.billingService.deletePlan(req.user, +id);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan via Stripe Checkout' })
  subscribe(@Req() req, @Query('plan_id') planId: string) {
    return this.billingService.subscribe(req.user, +planId);
  }

  @Post('buy-credits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buy a credit top-up package' })
  buyCredits(@Req() req, @Body() dto: CreditTopUpDto) {
    return this.billingService.buyCredits(req.user, dto);
  }

  @Post('verify-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify subscription payment — plan derived from Stripe session metadata, not client input' })
  verifySubscription(
    @Req() req,
    @Query('session_id') sessionId: string,
  ) {
    return this.billingService.verifySubscription(req.user, sessionId);
  }

  @Post('verify-credits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify credit top-up payment — package derived from Stripe session metadata, not client input' })
  verifyCredits(
    @Req() req,
    @Query('session_id') sessionId: string,
  ) {
    return this.billingService.verifyCredits(req.user, sessionId);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook endpoint (do not call manually)' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleStripeWebhook(req.rawBody, signature);
  }
}
