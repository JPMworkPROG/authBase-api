import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginRequestDto } from './dto/in/loginRequest.dto';
import { RefreshRequestDto } from './dto/in/refreshRequest.dto';
import { RegisterRequestDto } from './dto/in/registerRequest.dto';
import { RequestPasswordResetRequestDto } from './dto/in/requestPasswordResetRequest.dto';
import { ResetPasswordRequestDto } from './dto/in/resetPasswordRequest.dto';
import { LoginResponseDto } from './dto/out/loginResponse.dto';
import { RegisterResponseDto } from './dto/out/registerResponse.dto';
import { RefreshResponseDto } from './dto/out/refreshResponse.dto';
import { RequestPasswordResetResponseDto } from './dto/out/requestPasswordResetResponse.dto';
import { ResetPasswordResponseDto } from './dto/out/resetPasswordResponse.dto';
import { UserProfileResponseDto } from './dto/out/userProfileResponse.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Registra um novo usuário no sistema
   */
  async register(registerDto: RegisterRequestDto): Promise<RegisterResponseDto> {
    const { email, password, name } = registerDto;

    this.logger.log(`Iniciando registro de usuário: ${email}`);

    // Verificar se o email já está em uso
    const existingUser = await this.authRepository.findByEmail(email);

    if (existingUser) {
      this.logger.warn(`Tentativa de registro com email já existente: ${email}`);
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const saltRounds = this.configService.get<number>('auth.saltRounds', 10);
    this.logger.debug(`Gerando hash da senha com ${saltRounds} salt rounds`);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = new UserProfileResponseDto(await this.authRepository.create({
      email,
      name,
      password: hashedPassword,
      role: 'USER',
    }));

    this.logger.debug(`Usuário criado: ${user.id}`);

    // Gerar tokens
    const tokens = await this.generateTokens(user);
    const expiresIn = this.getExpiresInSeconds(
      this.configService.get<string>('jwt.accessExpires', '15m'),
    );

    this.logger.log(`Registro concluído com sucesso: ${user.id} (${user.email})`);

    return new RegisterResponseDto(
      user,
      tokens.accessToken,
      tokens.refreshToken,
      expiresIn,
    );
  }

  /**
   * Autentica um usuário e retorna tokens JWT
   */
  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    this.logger.debug(`Iniciando autenticação para: ${email}`);

    // Buscar usuário por email
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(`Tentativa de login com email não encontrado: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Tentativa de login com senha inválida para: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.debug(`Credenciais válidas para usuário: ${user.id}`);

    // Gerar tokens
    const tokens = await this.generateTokens(user);
    const expiresIn = this.getExpiresInSeconds(
      this.configService.get<string>('jwt.accessExpires', '15m'),
    );

    this.logger.log(`Login realizado com sucesso: ${user.id} (${user.email})`);

    // Retornar resposta completa
    return new LoginResponseDto(
      new UserProfileResponseDto(user),
      tokens.accessToken,
      tokens.refreshToken,
      expiresIn,
    );
  }

  /**
   * Renova tokens JWT usando refresh token válido
   */
  async refresh(refreshDto: RefreshRequestDto): Promise<RefreshResponseDto> {
    try {
      this.logger.debug('Verificando refresh token');

      // Verificar e decodificar o refresh token
      const payload = this.jwtService.verify(refreshDto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
      });

      this.logger.debug(`Refresh token válido para usuário: ${payload.sub}`);

      // Buscar usuário pelo ID do payload
      const user = await this.authRepository.findById(payload.sub);

      if (!user) {
        this.logger.warn(`Usuário não encontrado para refresh token: ${payload.sub}`);
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Gerar novos tokens
      const tokens = await this.generateTokens(user);
      const expiresIn = this.getExpiresInSeconds(
        this.configService.get<string>('jwt.accessExpires', '15m'),
      );

      this.logger.debug(`Tokens renovados com sucesso para usuário: ${user.id}`);

      // Retornar apenas access token e expiresIn
      return {
        accessToken: tokens.accessToken,
        expiresIn,
      };
    } catch (error) {
      this.logger.warn('Tentativa de renovação com refresh token inválido ou expirado');
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  /**
   * Gera tokens de acesso e refresh
   */
  private async generateTokens(user: UserProfileResponseDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    this.logger.debug(`Gerando tokens para usuário: ${user.id}`);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.accessExpires', '15m')! as any,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('jwt.refreshExpires', '7d')! as any,
        secret: this.configService.get<string>('jwt.refreshSecret')!,
      }),
    ]);

    this.logger.debug(`Tokens gerados com sucesso para usuário: ${user.id}`);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Converte string de expiração (ex: "15m", "1h") para segundos
   */
  private getExpiresInSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default: 15 minutos
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }

  /**
   * Solicita reset de senha gerando um token de validação
   */
  async requestPasswordReset(
    requestDto: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetResponseDto> {
    const { email } = requestDto;

    this.logger.log(`Solicitação de reset de senha para: ${email}`);

    // Buscar usuário por email
    const user = await this.authRepository.findByEmail(email);
    const expiresIn = this.configService.get<string>(
      'auth.passwordResetExpires',
      '1h',
    );
    const message = 'Se o email estiver cadastrado, você receberá instruções para resetar sua senha'

    if (!user) {
      this.logger.warn(`Tentativa de reset de senha para email não cadastrado: ${email}`);
      return new RequestPasswordResetResponseDto(
        message,
        '', // Token vazio quando usuário não existe
        this.getExpiresInSeconds(expiresIn),
      );
    }

    this.logger.debug(`Gerando token de reset para usuário: ${user.id}`);

    // Gerar token único e seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + this.getExpiresInSeconds(expiresIn),
    );

    // Salvar token no banco de dados
    await this.authRepository.createPasswordResetToken(
      user.id,
      resetToken,
      expiresAt,
    );

    this.logger.log(`Token de reset gerado e salvo para usuário: ${user.id} (${user.email})`);

    return new RequestPasswordResetResponseDto(
      message,
      resetToken,
      this.getExpiresInSeconds(expiresIn),
    );
  }

  /**
   * Reseta a senha do usuário usando o token de validação
   */
  async resetPassword(
    resetDto: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    const { token, newPassword } = resetDto;

    this.logger.log('Tentativa de reset de senha com token');

    // Buscar token e usuário
    const tokenData = await this.authRepository.findByPasswordResetToken(token);

    if (!tokenData) {
      this.logger.warn('Tentativa de reset com token inválido');
      throw new NotFoundException('Token de reset inválido');
    }

    const { user, resetToken } = tokenData;

    this.logger.debug(`Token encontrado para usuário: ${user.id}`);

    // Verificar se o token não expirou
    if (resetToken.expiresAt < new Date()) {
      this.logger.warn(`Tentativa de reset com token expirado para usuário: ${user.id}`);
      throw new BadRequestException('Token de reset expirado');
    }

    this.logger.debug(`Token válido, gerando hash da nova senha para usuário: ${user.id}`);

    // Hash da nova senha
    const saltRounds = this.configService.get<number>('auth.saltRounds', 10);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha e limpar tokens de reset
    await this.authRepository.updatePassword(user.id, hashedPassword);

    this.logger.log(`Senha resetada com sucesso para usuário: ${user.id} (${user.email})`);

    return new ResetPasswordResponseDto('Senha atualizada com sucesso');
  }
}
