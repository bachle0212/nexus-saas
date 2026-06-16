import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';
import { CORS_ORIGINS } from './common/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
    rawBody: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Nexus-API-Key'],
  });

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nexus AI API')
    .setDescription('AI Content Generation SaaS Platform — REST API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Nexus-API-Key', in: 'header' }, 'api-key')
    .addTag('Auth', 'Authentication & user management')
    .addTag('Generate', 'AI image generation')
    .addTag('Video', 'AI video generation')
    .addTag('Scripts', 'AI script writing')
    .addTag('Characters', 'Character vault management')
    .addTag('Billing', 'Subscriptions & payments')
    .addTag('Store', 'Marketplace & orders')
    .addTag('Analytics', 'Usage analytics')
    .addTag('Admin', 'Admin management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Nexus AI Docs',
  });

  const port = parseInt(process.env.PORT ?? '8791');
  const host = process.env.HOST ?? '127.0.0.1';
  await app.listen(port, host);
  logger.log(`Nexus NestJS API running on http://${host}:${port}`);
  logger.log(`Swagger docs available at http://${host}:${port}/api/docs`);
}
bootstrap();
