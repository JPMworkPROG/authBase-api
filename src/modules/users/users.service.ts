import {
  ConflictException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) { }

  /**
   * Buscar perfil do usuário logado
   */
  async findMe(userPayload: AuthenticatedUser): Promise<FindMeResponseDto> {
    this.logger.debug(`Fetching profile for user: ${userPayload.id}`);
    const user = await this.userRepository.findById(userPayload.id);

    if (!user) {
      this.logger.warn(`User not found: ${userPayload.id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    this.logger.debug(`Profile fetched successfully for user: ${user.id}`);
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

    this.logger.debug(`Searching users - Page: ${finalPage}, Limit: ${finalLimit}`);

    // Construir objeto de filtros
    const filters = {
      name: findManyUserDto.name ? findManyUserDto.name.split(',') : undefined,
      email: findManyUserDto.email ? findManyUserDto.email.split(',') : undefined,
      role: findManyUserDto.role ? findManyUserDto.role.split(',') as ('USER' | 'ADMIN')[] : undefined,
    };

    this.logger.debug(`Filters applied: ${JSON.stringify(filters)}`);

    const [users, total] = await Promise.all([
      this.userRepository.findMany(finalPage, finalLimit, filters),
      this.userRepository.count(filters),
    ]);

    this.logger.debug(`Found ${users.length} users (Total: ${total})`);

    const usersDto = users.map((user) => new FindOneResponseDto(user));

    return new FindManyResponseDto(usersDto, finalPage, finalLimit, total);
  }

  /**
   * Buscar usuário por ID
   */
  async findOne(id: string): Promise<FindOneResponseDto> {
    this.logger.debug(`Fetching user by ID: ${id}`);
    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    this.logger.debug(`User found: ${id}`);
    return new FindOneResponseDto(user);
  }

  /**
   * Criar novo usuário
   */
  async create(createDto: CreateRequestDto): Promise<CreateResponseDto> {
    const { email, password, name, role } = createDto;

    this.logger.debug(`Checking if email exists: ${email}`);
    // Verificar se o email já está em uso
    const emailExists = await this.userRepository.findByEmail(email);

    if (emailExists) {
      this.logger.warn(`User creation failed: Email already in use - ${email}`);
      throw new ConflictException('Email já está em uso');
    }

    this.logger.debug(`Hashing password for new user: ${email}`);
    const hashedPassword = await this.passwordHasher.hash(password);

    this.logger.debug(`Creating user in database: ${email}`);
    // Criar usuário
    const user = await this.userRepository.create({
      email,
      name,
      password: hashedPassword,
      role,
    });

    this.logger.log(`User created successfully: ${user.id} (${user.email})`);
    return new CreateResponseDto(user);
  }

  /**
   * Atualizar usuário
   */
  async update(
    id: string,
    updateUserDto: UpdateRequestDto
  ): Promise<UpdateResponseDto> {
    this.logger.debug(`Checking if user exists: ${id}`);
    // Verificar se o usuário existe
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      this.logger.warn(`User update failed: User not found - ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o email está sendo alterado
    if (updateUserDto.email) {
      if (updateUserDto.email === existingUser.email) {
        this.logger.warn(`User update failed: Email already in use - ${updateUserDto.email}`);
        throw new ConflictException('Email já está em uso');
      }

      this.logger.debug(`Checking if new email exists: ${updateUserDto.email}`);
      // Verificar se o novo email já existe
      const emailExists = await this.userRepository.findByEmail(updateUserDto.email);
      if (emailExists) {
        this.logger.warn(`User update failed: Email already in use - ${updateUserDto.email}`);
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

    if (updateUserDto.password) {
      this.logger.debug(`Hashing new password for user: ${id}`);
    }

    this.logger.debug(`Updating user in database: ${id}`);
    // Atualizar usuário
    const updatedUser = await this.userRepository.update(id, updateData);

    this.logger.log(`User updated successfully: ${id}`);
    return new UpdateResponseDto(updatedUser);
  }

  /**
   * Remover usuário
   */
  async remove(id: string): Promise<void> {
    this.logger.debug(`Checking if user exists: ${id}`);
    // Verificar se o usuário existe
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      this.logger.warn(`User deletion failed: User not found - ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    this.logger.debug(`Deleting user from database: ${id}`);
    await this.userRepository.delete(id);
    this.logger.log(`User deleted successfully: ${id}`);
  }
}
