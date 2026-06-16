import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, Role } from '../entities';
import { SECRET_KEY } from '../common/config';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { EmailService } from '../common/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.register({ secret: SECRET_KEY }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, EmailService],
  exports: [JwtAuthGuard, JwtModule, TypeOrmModule, EmailService],
})
export class AuthModule {}
