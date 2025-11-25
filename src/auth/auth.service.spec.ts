import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/in/registerRequest.dto';
import { LoginRequestDto } from './dto/in/loginRequest.dto';
import { RefreshRequestDto } from './dto/in/refreshRequest.dto';
import { UserProfileResponseDto } from './dto/out/userProfileResponse.dto';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserProfile = new UserProfileResponseDto({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.USER,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  });

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
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterRequestDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password@123',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);
      (configService.get as jest.Mock).mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'auth.saltRounds': 10,
          'jwt.accessExpires': '15m',
          'jwt.refreshExpires': '7d',
          'jwt.refreshSecret': 'refresh-secret',
        };
        return config[key] ?? defaultValue;
      });
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      authRepository.create.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(authRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(authRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        name: registerDto.name,
        password: 'hashedPassword123',
        role: 'USER',
      });
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(900); // 15m em segundos
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email já está em uso'),
      );
      expect(authRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'Password@123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      (configService.get as jest.Mock).mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'jwt.accessExpires': '15m',
          'jwt.refreshExpires': '7d',
          'jwt.refreshSecret': 'refresh-secret',
        };
        return config[key] ?? defaultValue;
      });
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(authRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(900); // 15m em segundos
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const refreshDto: RefreshRequestDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: Role.USER,
    };

    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      (configService.get as jest.Mock).mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'jwt.refreshSecret': 'refresh-secret',
          'jwt.accessExpires': '15m',
          'jwt.refreshExpires': '7d',
        };
        return config[key] ?? defaultValue;
      });
      jwtService.verify.mockReturnValue(mockPayload);
      authRepository.findById.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      // Act
      const result = await service.refresh(refreshDto);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith(refreshDto.refreshToken, {
        secret: 'refresh-secret',
      });
      expect(authRepository.findById).toHaveBeenCalledWith(mockPayload.sub);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 900, // 15m em segundos
      });
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Arrange
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        return undefined;
      });
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido ou expirado'),
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Arrange
      (configService.get as jest.Mock).mockImplementation((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'jwt.refreshSecret': 'refresh-secret',
          'jwt.accessExpires': '15m',
          'jwt.refreshExpires': '7d',
        };
        return config[key] ?? defaultValue;
      });
      jwtService.verify.mockReturnValue(mockPayload);
      authRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido ou expirado'),
      );
    });

    it('should throw UnauthorizedException when refresh token is expired', async () => {
      // Arrange
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        return undefined;
      });
      jwtService.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      // Act & Assert
      await expect(service.refresh(refreshDto)).rejects.toThrow(
        new UnauthorizedException('Refresh token inválido ou expirado'),
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens with correct payload', async () => {
      // Arrange
      (configService.get as jest.Mock)
        .mockReturnValueOnce('15m') // jwt.accessExpires
        .mockReturnValueOnce('7d') // jwt.refreshExpires
        .mockReturnValueOnce('refresh-secret'); // jwt.refreshSecret
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await service['generateTokens'](mockUserProfile);

      // Assert
      const expectedPayload = {
        sub: mockUserProfile.id,
        email: mockUserProfile.email,
        role: mockUserProfile.role,
      };

      expect(jwtService.signAsync).toHaveBeenCalledWith(expectedPayload, {
        expiresIn: '15m',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(expectedPayload, {
        expiresIn: '7d',
        secret: 'refresh-secret',
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });
});
