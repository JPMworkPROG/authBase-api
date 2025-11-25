import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation - carrega do arquivo openapi.yaml
  const openApiPath = path.join(process.cwd(), 'documentation', 'openapi.yaml');
  const openApiFile = fs.readFileSync(openApiPath, 'utf8');
  const swaggerDocument = yaml.load(openApiFile) as any;

  const port = configService.get<number>('port') || 8080;
  const baseUrl = process.env.DOMAIN_URL || `localhost`;

  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(port);

  console.log(`🚀 Application is running on: http://${baseUrl}:${port}`);
  console.log(`📚 Swagger documentation: http://${baseUrl}:${port}/api/docs`);
}
bootstrap();
