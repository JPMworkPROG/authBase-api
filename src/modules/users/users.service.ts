import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/in/createRequest.dto';
import { UpdateRequestDto } from './dto/in/updateRequest.dto';
import { FindManyRequestDto } from './dto/in/findManyRequest.dto';
import { FindMeResponseDto } from './dto/out/findMeResponse.dto';
import { FindOneResponseDto } from './dto/out/findOneResponse.dto';
import { FindManyResponseDto } from './dto/out/findManyResponse.dto';
import { CreateResponseDto } from './dto/out/createResponse.dto';
import { UpdateResponseDto } from './dto/out/updateResponse.dto';
import { UserRepository } from './repositories/user.repository';
import { PasswordHasher } from '@shared/services/password-hasher.service';
import type { AuthenticatedUser } from '@shared/types/authenticated-user.type';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) { }

  /**
   * Buscar perfil do usuário logado
   */
  async findMe(userPayload: AuthenticatedUser): Promise<FindMeResponseDto> {
    const user = await this.userRepository.findById(userPayload.id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return new FindMeResponseDto(user);
  }

  /**
   * Listar todos os usuários com filtros opcionais
   */
  async findMany(
    findManyUserDto: FindManyRequestDto,
  ): Promise<FindManyResponseDto> {
    const finalPage = findManyUserDto.page;
    const finalLimit = findManyUserDto.limit;

    // Construir objeto de filtros
    const filters = {
      name: findManyUserDto.name ? findManyUserDto.name.split(',') : undefined,
      email: findManyUserDto.email ? findManyUserDto.email.split(',') : undefined,
      role: findManyUserDto.role ? findManyUserDto.role.split(',') as ('USER' | 'ADMIN')[] : undefined,
    };

    const [users, total] = await Promise.all([
      this.userRepository.findMany(finalPage, finalLimit, filters),
      this.userRepository.count(filters),
    ]);

    const usersDto = users.map((user) => new FindOneResponseDto(user));

    return new FindManyResponseDto(usersDto, finalPage, finalLimit, total);
  }

  /**
   * Buscar usuário por ID
   */
  async findOne(id: string): Promise<FindOneResponseDto> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return new FindOneResponseDto(user);
  }

  /**
   * Criar novo usuário
   */
  async create(createDto: CreateRequestDto): Promise<CreateResponseDto> {
    const { email, password, name, role } = createDto;

    // Verificar se o email já está em uso
    const emailExists = await this.userRepository.findByEmail(email);

    if (emailExists) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await this.passwordHasher.hash(password);

    // Criar usuário
    const user = await this.userRepository.create({
      email,
      name,
      password: hashedPassword,
      role,
    });

    return new CreateResponseDto(user);
  }

  /**
   * Atualizar usuário
   */
  async update(
    id: string,
    updateUserDto: UpdateRequestDto
  ): Promise<UpdateResponseDto> {
    // Verificar se o usuário existe
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o email está sendo alterado
    if (updateUserDto.email) {
      if (updateUserDto.email === existingUser.email) {
        throw new ConflictException('Email já está em uso');
      }

      // Verificar se o novo email já existe
      const emailExists = await this.userRepository.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Preparar dados para atualização
    const updateData = {
      name: updateUserDto.name,
      email: updateUserDto.email,
      password: updateUserDto.password ? await this.passwordHasher.hash(updateUserDto.password) : undefined,
      role: updateUserDto.role,
    };

    // Atualizar usuário
    const updatedUser = await this.userRepository.update(id, updateData);

    return new UpdateResponseDto(updatedUser);
  }

  /**
   * Remover usuário
   */
  async remove(id: string): Promise<void> {
    // Verificar se o usuário existe
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.userRepository.delete(id);
  }
}
