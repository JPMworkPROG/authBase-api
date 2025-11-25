import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { parseDurationToSeconds } from '@shared/utils/duration.util';

@Injectable()
export class PasswordResetTokenService {
  constructor(private readonly configService: ConfigService) {}

  generateToken() {
    const expiresInSeconds = parseDurationToSeconds(
      this.configService.get<string>('auth.passwordResetExpires'),
      3600,
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return {
      token,
      expiresAt,
      expiresInSeconds,
    };
  }
}
