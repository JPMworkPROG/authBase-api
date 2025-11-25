import { Injectable } from '@nestjs/common';
import { User, Role, PasswordResetToken } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Busca um usuário por email (usado em login e verificação de email)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Busca um usuário por ID (usado em validação de token e refresh)
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Cria um novo usuário (usado em registro)
   */
  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: Role;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || Role.USER,
      },
    });
  }

  /**
   * Busca um token de reset de senha e retorna o usuário relacionado
   */
  async findByPasswordResetToken(token: string): Promise<{
    user: User;
    resetToken: PasswordResetToken;
  } | null> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return null;
    }

    return {
      user: resetToken.user,
      resetToken,
    };
  }

  /**
   * Cria um novo token de reset de senha e invalida tokens anteriores do usuário
   */
  async createPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    // Remover tokens anteriores do usuário
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    // Criar novo token
    return this.prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Atualiza a senha do usuário e remove todos os tokens de reset
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    // Remover todos os tokens de reset do usuário
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    // Atualizar senha
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
  }
}
