import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  getUsers(@Req() req) { return this.adminService.getUsers(req.user); }

  @Post('users')
  createUser(@Req() req, @Body() body) { return this.adminService.createUser(req.user, body); }

  @Put('users/:id')
  updateUser(@Req() req, @Param('id') id: string, @Body() body) {
    return this.adminService.updateUser(req.user, +id, body);
  }

  @Get('orders')
  getOrders(@Req() req) { return this.adminService.getOrders(req.user); }

  @Get('resources')
  getResources(@Req() req) { return this.adminService.getResources(req.user); }

  @Delete('resources/:id')
  deleteResource(@Req() req, @Param('id') id: string) {
    return this.adminService.deleteResource(req.user, +id);
  }

  @Get('roles')
  getRoles(@Req() req) { return this.adminService.getRoles(req.user); }

  @Post('roles')
  createRole(@Req() req, @Body() body) { return this.adminService.createRole(req.user, body); }

  @Put('roles/:id')
  updateRole(@Req() req, @Param('id') id: string, @Body() body) {
    return this.adminService.updateRole(req.user, +id, body);
  }

  @Post('products')
  createProduct(@Req() req, @Body() body) { return this.adminService.createProduct(req.user, body); }

  @Put('products/:id')
  updateProduct(@Req() req, @Param('id') id: string, @Body() body) {
    return this.adminService.updateProduct(req.user, +id, body);
  }

  @Delete('products/:id')
  deleteProduct(@Req() req, @Param('id') id: string) {
    return this.adminService.deleteProduct(req.user, +id);
  }
}
