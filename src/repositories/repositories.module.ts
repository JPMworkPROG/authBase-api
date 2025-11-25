import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthRepository } from './auth.repository';
import { UserRepository } from './user.repository';

@Global()
@Module({
  providers: [AuthRepository, UserRepository, PrismaService],
  exports: [AuthRepository, UserRepository, PrismaService],
})
export class RepositoriesModule { }

