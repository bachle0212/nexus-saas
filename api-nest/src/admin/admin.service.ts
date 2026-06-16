import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role, Generation, VideoGeneration, Order, Product } from '../entities';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Generation) private genRepo: Repository<Generation>,
    @InjectRepository(VideoGeneration) private videoRepo: Repository<VideoGeneration>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  private checkAdmin(user: User) {
    const perms = user.permissions?.split(',') || [];
    if (!perms.includes('roles:manage') && user.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }
  }

  async getUsers(user: User) {
    const perms = user.permissions?.split(',') || [];
    if (!perms.includes('users:read') && user.role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    return this.userRepo.find({ order: { created_at: 'DESC' } });
  }

  async createUser(user: User, body: any) {
    const perms = user.permissions?.split(',') || [];
    if (!perms.includes('users:write') && user.role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    const existing = await this.userRepo.findOne({ where: { email: body.email } });
    if (existing) throw new ForbiddenException('Email already exists');
    const hashed = await bcrypt.hash(body.password, 10);
    const newUser = this.userRepo.create({
      email: body.email,
      hashed_password: hashed,
      role: body.role || 'user',
      credits: body.credits || 100,
      permissions: body.permissions || 'generate:image',
    });
    await this.userRepo.save(newUser);
    return { message: 'User created', user_id: newUser.id };
  }

  async updateUser(user: User, targetId: number, body: any) {
    const perms = user.permissions?.split(',') || [];
    if (!perms.includes('users:write') && user.role !== 'admin') {
      throw new ForbiddenException('Forbidden');
    }
    const target = await this.userRepo.findOne({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');
    if (body.email) target.email = body.email;
    if (body.role) target.role = body.role;
    if (body.credits !== undefined) target.credits = body.credits;
    if (body.password) target.hashed_password = await bcrypt.hash(body.password, 10);
    if (body.permissions) target.permissions = body.permissions;
    await this.userRepo.save(target);
    return { message: 'User updated' };
  }

  async getOrders(user: User) {
    this.checkAdmin(user);
    return this.orderRepo.find({ order: { created_at: 'DESC' } });
  }

  async getResources(user: User) {
    this.checkAdmin(user);
    const generations = await this.genRepo.find({ order: { created_at: 'DESC' } });
    const videos = await this.videoRepo.find({ order: { created_at: 'DESC' } });
    return { generations, videos };
  }

  async deleteResource(user: User, genId: number) {
    this.checkAdmin(user);
    const gen = await this.genRepo.findOne({ where: { id: genId } });
    if (!gen) throw new NotFoundException('Not found');
    await this.genRepo.remove(gen);
    return { message: 'Deleted' };
  }

  async getRoles(user: User) {
    this.checkAdmin(user);
    return this.roleRepo.find();
  }

  async createRole(user: User, body: { name: string; description: string; permissions: string }) {
    this.checkAdmin(user);
    const role = this.roleRepo.create(body);
    await this.roleRepo.save(role);
    return role;
  }

  async updateRole(user: User, roleId: number, body: any) {
    this.checkAdmin(user);
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    if (body.name) role.name = body.name;
    if (body.description) role.description = body.description;
    if (body.permissions) role.permissions = body.permissions;
    await this.roleRepo.save(role);
    return role;
  }

  async createProduct(user: User, body: any) {
    this.checkAdmin(user);
    const product = this.productRepo.create(body);
    await this.productRepo.save(product);
    return product;
  }

  async updateProduct(user: User, productId: number, body: any) {
    this.checkAdmin(user);
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    Object.assign(product, body);
    await this.productRepo.save(product);
    return product;
  }

  async deleteProduct(user: User, productId: number) {
    this.checkAdmin(user);
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    await this.productRepo.remove(product);
    return { message: 'Product deleted' };
  }
}
