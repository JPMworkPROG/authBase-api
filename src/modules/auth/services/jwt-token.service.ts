import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { JwtPayload } from '../strategies/jwt.strategy';
import { parseDurationToSeconds } from '@shared/utils/duration.util';

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async generateTokens(payload: JwtPayload): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.accessExpires', '15m') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.refreshExpires', '7d') as StringValue,
        secret: this.configService.get<string>('jwt.refreshSecret')!,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpirationSeconds(),
    };
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  getAccessTokenExpirationSeconds(): number {
    return parseDurationToSeconds(
      this.configService.get<string>('jwt.accessExpires'),
      900,
    );
  }
}
