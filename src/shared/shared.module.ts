import { Module } from '@nestjs/common';
import { PasswordHasher } from './services/password-hasher.service';

@Module({
  providers: [PasswordHasher],
  exports: [PasswordHasher],
})
export class SharedModule {}
