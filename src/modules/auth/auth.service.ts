import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LoginRequestDto } from './dto/in/loginRequest.dto';
import { RefreshRequestDto } from './dto/in/refreshRequest.dto';
import { RegisterRequestDto } from './dto/in/registerRequest.dto';
import { RequestPasswordResetRequestDto } from './dto/in/requestPasswordResetRequest.dto';
import { ResetPasswordRequestDto } from './dto/in/resetPasswordRequest.dto';
import { LoginResponseDto } from './dto/out/loginResponse.dto';
import { RefreshResponseDto } from './dto/out/refreshResponse.dto';
import { RegisterResponseDto } from './dto/out/registerResponse.dto';
import { RequestPasswordResetResponseDto } from './dto/out/requestPasswordResetResponse.dto';
import { ResetPasswordResponseDto } from './dto/out/resetPasswordResponse.dto';
import { UserProfileResponseDto } from './dto/out/userProfileResponse.dto';
import { AuthRepository } from './repositories/auth.repository';
import { PasswordHasher } from '@shared/services/password-hasher.service';
import { JwtTokenService } from './services/jwt-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';

@Injectable()
export class AuthService {
  private readonly passwordResetMessage = 'Se o email estiver cadastrado, enviaremos instruções para resetar a senha';

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtTokenService: JwtTokenService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
  ) {}

  async register(registerDto: RegisterRequestDto): Promise<RegisterResponseDto> {
    const existingUser = await this.authRepository.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await this.passwordHasher.hash(registerDto.password);
    const user = await this.authRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: 'USER',
    });

    const profile = new UserProfileResponseDto(user);
    const tokens = await this.jwtTokenService.generateTokens({
      sub: profile.id,
      email: profile.email,
      role: profile.role,
    });

    return new RegisterResponseDto(
      profile,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );
  }

  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.authRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await this.passwordHasher.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const profile = new UserProfileResponseDto(user);
    const tokens = await this.jwtTokenService.generateTokens({
      sub: profile.id,
      email: profile.email,
      role: profile.role,
    });

    return new LoginResponseDto(
      profile,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );
  }

  async refresh(refreshDto: RefreshRequestDto): Promise<RefreshResponseDto> {
    const payload = this.jwtTokenService.verifyRefreshToken(refreshDto.refreshToken);
    const user = await this.authRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const tokens = await this.jwtTokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async requestPasswordReset(
    requestDto: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetResponseDto> {
    const user = await this.authRepository.findByEmail(requestDto.email);
    const { token, expiresAt, expiresInSeconds } = this.passwordResetTokenService.generateToken();

    if (user) {
      await this.authRepository.createPasswordResetToken(user.id, token, expiresAt);
    }

    return new RequestPasswordResetResponseDto(
      this.passwordResetMessage,
      randomUUID(),
      expiresInSeconds,
    );
  }

  async resetPassword(resetDto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    const tokenData = await this.authRepository.findByPasswordResetToken(resetDto.token);

    if (!tokenData) {
      throw new NotFoundException('Token de reset inválido');
    }

    if (tokenData.resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token de reset expirado');
    }

    const hashedPassword = await this.passwordHasher.hash(resetDto.newPassword);
    await this.authRepository.updatePassword(tokenData.user.id, hashedPassword);

    return new ResetPasswordResponseDto('Senha atualizada com sucesso');
  }
}
