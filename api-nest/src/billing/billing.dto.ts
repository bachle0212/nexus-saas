import { IsString, IsInt, IsOptional } from 'class-validator';

export class PlanCreateDto {
  @IsString()
  name: string;

  @IsInt()
  price_usd: number;

  @IsInt()
  monthly_credits: number;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsString()
  stripe_price_id?: string;
}

export class SubscribeDto {
  plan_id: number;
}

// plan_id removed — derived server-side from Stripe session metadata to prevent price manipulation

export class CreditTopUpDto {
  @IsString()
  package_id: string;
}
