import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  permissions: string;

  @Column({ nullable: true })
  description: string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  hashed_password: string;

  @Column({ default: 10 })
  credits: number;

  @Column({ default: 'Free' })
  plan: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: 'generate:image', nullable: true })
  permissions: string;

  @Column({ nullable: true })
  display_name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  email_verify_token: string;

  @Column({ nullable: true })
  reset_password_token: string;

  @Column({ nullable: true, type: 'timestamp' })
  reset_password_expires: Date;

  @Column({ nullable: true })
  stripe_customer_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true, unique: true })
  api_key: string;
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  price_usd: number;

  @Column()
  monthly_credits: number;

  @Column({ nullable: true })
  features: string;

  @Column({ nullable: true })
  stripe_price_id: string;
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  amount: number;

  @Column()
  credits_added: number;

  @Column({ default: 'completed' })
  status: string;

  @Column({ nullable: true })
  stripe_session_id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  invoice_url: string;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('generations')
export class Generation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  prompt: string;

  @Column({ nullable: true })
  result_url: string;

  @Column({ nullable: true })
  cost: number;

  @Column({ default: 1024 })
  width: number;

  @Column({ default: 1024 })
  height: number;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('characters')
export class CharacterProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  prompt_injection: string;

  @Column({ nullable: true })
  seed: number;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('video_generations')
export class VideoGeneration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  prompt: string;

  @Column({ nullable: true })
  result_url: string;

  @Column({ default: 'completed' })
  status: string;

  @Column({ default: 20 })
  cost: number;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('scripts')
export class Script {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  price: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ default: 100 })
  inventory: number;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  total_amount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  shipping_address: string;

  @Column({ nullable: true })
  stripe_session_id: string;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column()
  product_id: number;

  @Column()
  quantity: number;

  @Column()
  price_at_time: number;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  user_email: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  resource: string;

  @Column({ nullable: true, type: 'text' })
  meta: string;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ default: 'info' })
  type: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({ nullable: true })
  link: string;

  @CreateDateColumn()
  created_at: Date;
}
