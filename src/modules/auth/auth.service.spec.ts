import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { PasswordHasher } from '@shared/services/password-hasher.service';
import { JwtTokenService } from './services/jwt-token.service';
import { PasswordResetTokenService } from './services/password-reset-token.service';
import { RegisterRequestDto } from './dto/in/registerRequest.dto';
import { LoginRequestDto } from './dto/in/loginRequest.dto';
import { RefreshRequestDto } from './dto/in/refreshRequest.dto';
import { RequestPasswordResetRequestDto } from './dto/in/requestPasswordResetRequest.dto';
import { ResetPasswordRequestDto } from './dto/in/resetPasswordRequest.dto';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let passwordResetTokenService: jest.Mocked<PasswordResetTokenService>;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            findByPasswordResetToken: jest.fn(),
            createPasswordResetToken: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: PasswordHasher,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
        {
          provide: JwtTokenService,
          useValue: {
            generateTokens: jest.fn(),
            verifyRefreshToken: jest.fn(),
          },
        },
        {
          provide: PasswordResetTokenService,
          useValue: {
            generateToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    authRepository = module.get(AuthRepository);
    passwordHasher = module.get(PasswordHasher);
    jwtTokenService = module.get(JwtTokenService);
    passwordResetTokenService = module.get(PasswordResetTokenService);
  });

  describe('register', () => {
    const registerDto: RegisterRequestDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password@123',
    };

    it('should register a new user', async () => {
      authRepository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue('hashed');
      authRepository.create.mockResolvedValue(mockUser);
      jwtTokenService.generateTokens.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
      });

      const result = await service.register(registerDto);

      expect(authRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(passwordHasher.hash).toHaveBeenCalledWith(registerDto.password);
      expect(authRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        name: registerDto.name,
        password: 'hashed',
        role: 'USER',
      });
      expect(result.accessToken).toBe('access');
      expect(result.refreshToken).toBe('refresh');
    });

    it('should throw when email already exists', async () => {
      authRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(authRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'Password@123',
    };

    it('should authenticate when credentials are valid', async () => {
      authRepository.findByEmail.mockResolvedValue(mockUser);
      passwordHasher.compare.mockResolvedValue(true);
      jwtTokenService.generateTokens.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
      });

      const result = await service.login(loginDto);

      expect(passwordHasher.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result.refreshToken).toBe('refresh');
    });

    it('should throw when user is not found', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(passwordHasher.compare).not.toHaveBeenCalled();
    });

    it('should throw when password is invalid', async () => {
      authRepository.findByEmail.mockResolvedValue(mockUser);
      passwordHasher.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    const refreshDto: RefreshRequestDto = {
      refreshToken: 'refresh-token',
    };

    it('should return new access token', async () => {
      jwtTokenService.verifyRefreshToken.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      authRepository.findById.mockResolvedValue(mockUser);
      jwtTokenService.generateTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 600,
      });

      const result = await service.refresh(refreshDto);

      expect(result).toEqual({
        accessToken: 'new-access',
        expiresIn: 600,
      });
    });

    it('should throw when user does not exist', async () => {
      jwtTokenService.verifyRefreshToken.mockReturnValue({
        sub: 'missing',
        email: mockUser.email,
        role: mockUser.role,
      });
      authRepository.findById.mockResolvedValue(null);

      await expect(service.refresh(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('requestPasswordReset', () => {
    const requestDto: RequestPasswordResetRequestDto = {
      email: 'test@example.com',
    };
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    beforeEach(() => {
      passwordResetTokenService.generateToken.mockReturnValue({
        token: 'reset-token',
        expiresAt,
        expiresInSeconds: 3600,
      });
    });

    it('should persist token when user exists', async () => {
      authRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.requestPasswordReset(requestDto);

      expect(authRepository.createPasswordResetToken).toHaveBeenCalledWith(
        mockUser.id,
        'reset-token',
        expiresAt,
      );
      expect(result.message).toBeDefined();
    });

    it('should not persist when user is missing', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await service.requestPasswordReset(requestDto);

      expect(authRepository.createPasswordResetToken).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetDto: ResetPasswordRequestDto = {
      token: 'reset-token',
      newPassword: 'Password@123',
    };

    it('should reset password when token is valid', async () => {
      const expiresAt = new Date(Date.now() + 60000);
      authRepository.findByPasswordResetToken.mockResolvedValue({
        user: mockUser,
        resetToken: { id: 'token-id', token: 'reset-token', userId: mockUser.id, expiresAt, createdAt: new Date(), updatedAt: new Date() },
      } as any);
      passwordHasher.hash.mockResolvedValue('hashed');

      await service.resetPassword(resetDto);

      expect(passwordHasher.hash).toHaveBeenCalledWith(resetDto.newPassword);
      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        'hashed',
      );
    });

    it('should throw when token not found', async () => {
      authRepository.findByPasswordResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when token expired', async () => {
      const expiresAt = new Date(Date.now() - 1000);
      authRepository.findByPasswordResetToken.mockResolvedValue({
        user: mockUser,
        resetToken: { id: 'token-id', token: 'reset-token', userId: mockUser.id, expiresAt, createdAt: new Date(), updatedAt: new Date() },
      } as any);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
