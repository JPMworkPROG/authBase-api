import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Public } from '@shared/decorators/public.decorator';
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
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  async register(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }


  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(
    @Body() loginDto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  async refresh(
    @Body() refreshDto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    return this.authService.refresh(refreshDto);
  }

  @Post('requestPasswordReset')
  @HttpCode(HttpStatus.OK)
  @Public()
  async requestPasswordReset(
    @Body() requestDto: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetResponseDto> {
    return this.authService.requestPasswordReset(requestDto);
  }

  @Post('resetPassword')
  @HttpCode(HttpStatus.OK)
  @Public()
  async resetPassword(
    @Body() resetDto: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(resetDto);
  }
}
