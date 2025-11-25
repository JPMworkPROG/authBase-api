import { Injectable } from '@nestjs/common';
import { User, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@core/database/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Busca um usuário por ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Busca um usuário por email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Cria um novo usuário
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
   * Atualiza um usuário
   */
  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Remove um usuário
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Constrói a cláusula WHERE para filtros
   */
  private buildWhereClause(filters: {
    name: string[] | undefined;
    email: string[] | undefined;
    role: Role[] | undefined;
  }): Prisma.UserWhereInput {
    const whereConditions: Prisma.UserWhereInput[] = [];

    // Filtro por nome: busca parcial (substring) case-insensitive
    if (filters.name && filters.name.length > 0) {
      whereConditions.push({
        OR: filters.name.map((name) => ({
          name: { contains: name.trim(), mode: Prisma.QueryMode.insensitive },
        })),
      });
    }

    // Filtro por email: busca parcial (substring) case-insensitive
    if (filters.email && filters.email.length > 0) {
      whereConditions.push({
        OR: filters.email.map((email) => ({
          email: { contains: email.trim(), mode: Prisma.QueryMode.insensitive },
        })),
      });
    }

    // Filtro por role: busca exata (enum)
    if (filters.role && filters.role.length > 0) {
      whereConditions.push({
        role: { in: filters.role },
      });
    }

    return whereConditions.length === 0
      ? {}
      : whereConditions.length === 1
        ? whereConditions[0]
        : { AND: whereConditions };
  }

  /**
   * Lista usuários com paginação e filtros opcionais
   */
  async findMany(
    page: number,
    limit: number,
    filters: {
      name: string[] | undefined;
      email: string[] | undefined;
      role: Role[] | undefined;
    },
  ): Promise<User[]> {
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filters);

    return this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Conta o total de usuários com filtros opcionais
   */
  async count(filters: {
    name: string[] | undefined;
    email: string[] | undefined;
    role: Role[] | undefined;
  }): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.user.count({ where });
  }
}
