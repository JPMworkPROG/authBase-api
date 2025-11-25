import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { HttpExceptionFilter } from '@shared/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@shared/filters/prisma-exception.filter';
import { ValidationExceptionFilter } from '@shared/filters/validation-exception.filter';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';

@Global()
@Module({
  imports: [AppConfigModule, DatabaseModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AppConfigModule, DatabaseModule],
})
export class CoreModule { }
