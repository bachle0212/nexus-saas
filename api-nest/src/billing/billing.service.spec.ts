// Must mock config before any imports that use it
jest.mock('../common/config', () => ({
  STRIPE_SECRET_KEY: 'stripe_key_mock_for_testing',
  STRIPE_WEBHOOK_SECRET: 'webhook_secret_mock_for_testing',
  FRONTEND_URL: 'http://localhost:5173',
}));

const mockSessionRetrieve = jest.fn();
const mockSessionCreate = jest.fn();

// Stripe is a default export — must use __esModule: true so ts-jest's
// `import Stripe from 'stripe'` resolves to the mock class, not undefined.
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: { retrieve: mockSessionRetrieve, create: mockSessionCreate },
    },
    webhooks: { constructEvent: jest.fn() },
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionPlan, Payment, User } from '../entities';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const adminUser = {
  id: 1,
  email: 'admin@nexus.ai',
  credits: 1000,
  plan: 'Enterprise',
  permissions: 'roles:manage,users:read',
};

const regularUser = {
  id: 2,
  email: 'user@nexus.ai',
  credits: 50,
  plan: 'Free',
  permissions: 'generate:image',
};

const mockPlan = { id: 1, name: 'Pro', price_usd: 29, monthly_credits: 500, features: '[]' };

const mockPlanRepo = {
  find: jest.fn().mockResolvedValue([mockPlan]),
  findOne: jest.fn().mockResolvedValue(mockPlan),
  create: jest.fn().mockReturnValue(mockPlan),
  save: jest.fn().mockResolvedValue(mockPlan),
  remove: jest.fn(),
};

const mockPaymentRepo = {
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockReturnValue({}),
  save: jest.fn().mockResolvedValue({}),
};

const mockUserRepo = {
  save: jest.fn(),
  findOne: jest.fn(),
};

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getRepositoryToken(SubscriptionPlan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
    mockPlanRepo.findOne.mockResolvedValue(mockPlan);
    mockPaymentRepo.findOne.mockResolvedValue(null);
  });

  // ─── Basic plan CRUD ─────────────────────────────────────────────────────

  describe('getPlans', () => {
    it('returns all plans', async () => {
      mockPlanRepo.find.mockResolvedValue([mockPlan]);
      const plans = await service.getPlans();
      expect(plans).toHaveLength(1);
      expect(plans[0].name).toBe('Pro');
    });
  });

  describe('getCreditPackages', () => {
    it('returns 3 packages', () => {
      const pkgs = service.getCreditPackages();
      expect(pkgs).toHaveLength(3);
      expect(pkgs[0].id).toBe('credits_100');
    });

    it('packages have required fields', () => {
      service.getCreditPackages().forEach(pkg => {
        expect(pkg).toHaveProperty('id');
        expect(pkg).toHaveProperty('credits');
        expect(pkg).toHaveProperty('price_usd');
        expect(pkg.credits).toBeGreaterThan(0);
        expect(pkg.price_usd).toBeGreaterThan(0);
      });
    });
  });

  describe('createPlan', () => {
    it('throws ForbiddenException for non-admin', async () => {
      await expect(
        service.createPlan(regularUser as any, { name: 'Test', price_usd: 10, monthly_credits: 100 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates plan for admin with roles:manage permission', async () => {
      mockPlanRepo.create.mockReturnValue(mockPlan);
      mockPlanRepo.save.mockResolvedValue(mockPlan);
      const result = await service.createPlan(adminUser as any, { name: 'Pro', price_usd: 29, monthly_credits: 500 });
      expect(result.name).toBe('Pro');
      expect(mockPlanRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePlan', () => {
    it('throws ForbiddenException for non-admin', async () => {
      await expect(
        service.updatePlan(regularUser as any, 1, { name: 'Hack', price_usd: 0, monthly_credits: 9999 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if plan does not exist', async () => {
      mockPlanRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updatePlan(adminUser as any, 999, { name: 'X', price_usd: 1, monthly_credits: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePlan', () => {
    it('throws NotFoundException if plan does not exist', async () => {
      mockPlanRepo.findOne.mockResolvedValue(null);
      await expect(service.deletePlan(adminUser as any, 999)).rejects.toThrow(NotFoundException);
    });

    it('deletes existing plan as admin', async () => {
      mockPlanRepo.findOne.mockResolvedValue(mockPlan);
      mockPlanRepo.remove.mockResolvedValue({});
      const result = await service.deletePlan(adminUser as any, 1);
      expect(result.message).toContain('deleted');
      expect(mockPlanRepo.remove).toHaveBeenCalledWith(mockPlan);
    });
  });

  describe('getBillingHistory', () => {
    it('returns user payment history', async () => {
      mockPaymentRepo.find.mockResolvedValue([{ id: 1, amount: 29 }]);
      const history = await service.getBillingHistory(regularUser as any);
      expect(history).toHaveLength(1);
    });

    it('returns empty array when no payments', async () => {
      mockPaymentRepo.find.mockResolvedValue([]);
      const history = await service.getBillingHistory(regularUser as any);
      expect(history).toHaveLength(0);
    });
  });

  // ─── SECURITY: verifyCredits ──────────────────────────────────────────────

  describe('verifyCredits — IDOR / price manipulation prevention', () => {
    const validSession = {
      payment_status: 'paid',
      client_reference_id: '2',          // matches regularUser.id
      metadata: { package_id: 'credits_100', user_id: '2' },
      amount_total: 500,
    };

    it('SECURITY: throws ForbiddenException when session belongs to a different user', async () => {
      mockSessionRetrieve.mockResolvedValue({
        ...validSession,
        client_reference_id: '99',       // different user
        metadata: { package_id: 'credits_1000', user_id: '99' },
      });

      await expect(
        service.verifyCredits(regularUser as any, 'cs_test_attacker'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SECURITY: reads credit amount from Stripe metadata, never from client input', async () => {
      mockSessionRetrieve.mockResolvedValue(validSession);
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockPaymentRepo.create.mockReturnValue({});
      mockPaymentRepo.save.mockResolvedValue({});
      mockUserRepo.save.mockResolvedValue({});

      const user = { ...regularUser };
      await service.verifyCredits(user as any, 'cs_test_valid');

      // Should add exactly 100 credits (from 'credits_100' package), not any attacker-supplied value
      expect(user.credits).toBe(regularUser.credits + 100);
    });

    it('returns "Payment not completed" for unpaid sessions', async () => {
      mockSessionRetrieve.mockResolvedValue({
        ...validSession,
        payment_status: 'unpaid',
      });

      const result = await service.verifyCredits(regularUser as any, 'cs_test_unpaid');
      expect(result.message).toContain('not completed');
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('returns "Already processed" for duplicate session', async () => {
      mockSessionRetrieve.mockResolvedValue(validSession);
      mockPaymentRepo.findOne.mockResolvedValue({ id: 5 }); // already exists

      const result = await service.verifyCredits(regularUser as any, 'cs_test_dup');
      expect(result.message).toContain('Already processed');
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for invalid package_id in metadata', async () => {
      mockSessionRetrieve.mockResolvedValue({
        ...validSession,
        metadata: { package_id: 'credits_INVALID', user_id: '2' },
      });

      await expect(
        service.verifyCredits(regularUser as any, 'cs_test_bad_pkg'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── SECURITY: verifySubscription ────────────────────────────────────────

  describe('verifySubscription — session ownership check', () => {
    it('SECURITY: throws ForbiddenException when session user_id does not match JWT user', async () => {
      mockSessionRetrieve.mockResolvedValue({
        payment_status: 'paid',
        client_reference_id: '999',      // attacker's session
        metadata: { plan_id: '1', user_id: '999' },
        amount_total: 2900,
      });

      await expect(
        service.verifySubscription(regularUser as any, 'cs_test_attacker_sub'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('upgrades plan from Stripe session metadata', async () => {
      mockSessionRetrieve.mockResolvedValue({
        payment_status: 'paid',
        client_reference_id: '2',
        metadata: { plan_id: '1', user_id: '2' },
        amount_total: 2900,
      });
      mockPaymentRepo.findOne.mockResolvedValue(null);
      mockPaymentRepo.create.mockReturnValue({});
      mockPaymentRepo.save.mockResolvedValue({});
      mockUserRepo.save.mockResolvedValue({});

      const user = { ...regularUser };
      const result = await service.verifySubscription(user as any, 'cs_test_sub_ok');
      expect(result.message).toContain('verified');
      expect(user.plan).toBe('Pro');
      expect(user.credits).toBe(regularUser.credits + mockPlan.monthly_credits);
    });
  });
});
