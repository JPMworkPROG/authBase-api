import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
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

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerToAdmin(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    this.logger.log(`Tentativa de registro de novo usuário: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);
    this.logger.log(`Usuário registrado com sucesso: ${result.user.id} (${result.user.email})`);
    return result;
  }


  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    this.logger.log(`Tentativa de login: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    this.logger.log(`Login realizado com sucesso: ${result.user.id} (${result.user.email})`);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshDto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    this.logger.debug('Tentativa de renovação de token');
    const result = await this.authService.refresh(refreshDto);
    this.logger.debug('Token renovado com sucesso');
    return result;
  }

  @Post('requestPasswordReset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() requestDto: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetResponseDto> {
    this.logger.log(`Solicitação de reset de senha para: ${requestDto.email}`);
    const result = await this.authService.requestPasswordReset(requestDto);
    this.logger.log(`Reset de senha processado para: ${requestDto.email}`);
    return result;
  }

  @Post('resetPassword')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetDto: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    this.logger.log('Tentativa de reset de senha com token');
    const result = await this.authService.resetPassword(resetDto);
    this.logger.log('Senha resetada com sucesso');
    return result;
  }
}
