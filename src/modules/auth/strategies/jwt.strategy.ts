import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserProfileResponseDto } from '../dto/out/userProfileResponse.dto';
import { AuthRepository } from '../repositories/auth.repository';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<UserProfileResponseDto> {
    this.logger.debug(`Validating JWT token for user: ${payload.sub}`);
    const user = await this.authRepository.findById(payload.sub);

    if (!user) {
      this.logger.warn(`JWT validation failed: User not found - ${payload.sub}`);
      throw new UnauthorizedException('Token inválido');
    }

    this.logger.debug(`JWT token validated successfully for user: ${user.id}`);
    return new UserProfileResponseDto(user);
  }
}
