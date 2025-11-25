import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CreateRequestDto } from './dto/in/createRequest.dto';
import { UpdateRequestDto } from './dto/in/updateRequest.dto';
import { FindManyRequestDto } from './dto/in/findManyRequest.dto';
import { FindMeRequestDto } from './dto/in/findMeRequest.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { FindMeResponseDto } from './dto/out/findMeResponse.dto';
import { FindOneResponseDto } from './dto/out/findOneResponse.dto';
import { FindManyResponseDto } from './dto/out/findManyResponse.dto';
import { CreateResponseDto } from './dto/out/createResponse.dto';
import { UpdateResponseDto } from './dto/out/updateResponse.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Buscar perfil do usuário logado
   */
  async findMe(findMeUserDto: FindMeRequestDto): Promise<FindMeResponseDto> {
    this.logger.debug(`Buscando perfil do usuário: ${findMeUserDto.id}`);
    const user = await this.userRepository.findById(findMeUserDto.id);

    if (!user) {
      this.logger.warn(`Usuário não encontrado: ${findMeUserDto.id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    this.logger.debug(`Perfil do usuário ${findMeUserDto.id} recuperado com sucesso`);
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

    this.logger.debug(`Buscando usuários - página: ${finalPage}, limite: ${finalLimit}`);

    // Construir objeto de filtros
    const filters = {
      name: findManyUserDto.name ? findManyUserDto.name.split(',') : undefined,
      email: findManyUserDto.email ? findManyUserDto.email.split(',') : undefined,
      role: findManyUserDto.role ? findManyUserDto.role.split(',') as ('USER' | 'ADMIN')[] : undefined,
    };

    if (filters.name || filters.email || filters.role) {
      this.logger.debug(`Aplicando filtros: ${JSON.stringify(filters)}`);
    }

    const [users, total] = await Promise.all([
      this.userRepository.findMany(finalPage, finalLimit, filters),
      this.userRepository.count(filters),
    ]);

    const usersDto = users.map((user) => new FindOneResponseDto(user));

    this.logger.debug(`Busca concluída: ${users.length} usuário(s) encontrado(s) de ${total} total`);
    return new FindManyResponseDto(usersDto, finalPage, finalLimit, total);
  }

  /**
   * Buscar usuário por ID
   */
  async findOne(id: string): Promise<FindOneResponseDto> {
    this.logger.debug(`Buscando usuário por ID: ${id}`);
    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn(`Usuário não encontrado: ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    this.logger.debug(`Usuário ${id} encontrado: ${user.email}`);
    return new FindOneResponseDto(user);
  }

  /**
   * Criar novo usuário
   */
  async create(createDto: CreateRequestDto): Promise<CreateResponseDto> {
    const { email, password, name, role } = createDto;

    this.logger.log(`Iniciando criação de usuário: ${email}`);

    // Verificar se o email já está em uso
    const emailExists = await this.userRepository.findByEmail(email);

    if (emailExists) {
      this.logger.warn(`Tentativa de criar usuário com email já existente: ${email}`);
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const saltRounds = this.configService.get<number>('auth.saltRounds', 10);
    this.logger.debug(`Gerando hash da senha com ${saltRounds} salt rounds`);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await this.userRepository.create({
      email,
      name,
      password: hashedPassword,
      role,
    });

    this.logger.log(`Usuário criado com sucesso: ${user.id} (${user.email}) - Role: ${user.role}`);
    return new CreateResponseDto(user);
  }

  /**
   * Atualizar usuário
   */
  async update(
    id: string,
    updateUserDto: UpdateRequestDto
  ): Promise<UpdateResponseDto> {
    this.logger.log(`Iniciando atualização do usuário: ${id}`);

    // Verificar se o usuário existe
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      this.logger.warn(`Tentativa de atualizar usuário inexistente: ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o email está sendo alterado
    if (updateUserDto.email) {
      if (updateUserDto.email === existingUser.email) {
        this.logger.warn(`Tentativa de atualizar para o mesmo email: ${updateUserDto.email}`);
        throw new ConflictException('Email já está em uso');
      }

      // Verificar se o novo email já existe
      this.logger.debug(`Verificando disponibilidade do novo email: ${updateUserDto.email}`);
      const emailExists = await this.userRepository.findByEmail(updateUserDto.email);
      if (emailExists) {
        this.logger.warn(`Tentativa de atualizar para email já existente: ${updateUserDto.email}`);
        throw new ConflictException('Email já está em uso');
      }
    }

    // Preparar dados para atualização
    const updateData = {
      name: updateUserDto.name,
      email: updateUserDto.email,
      password: updateUserDto.password ? await bcrypt.hash(updateUserDto.password, this.configService.get<number>('auth.saltRounds', 10)) : undefined,
      role: updateUserDto.role,
    };

    if (updateUserDto.password) {
      this.logger.debug(`Senha será atualizada para o usuário: ${id}`);
    }

    // Atualizar usuário
    const updatedUser = await this.userRepository.update(id, updateData);

    this.logger.log(`Usuário ${id} atualizado com sucesso`);
    return new UpdateResponseDto(updatedUser);
  }

  /**
   * Remover usuário
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Iniciando remoção do usuário: ${id}`);

    // Verificar se o usuário existe
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      this.logger.warn(`Tentativa de remover usuário inexistente: ${id}`);
      throw new NotFoundException('Usuário não encontrado');
    }

    this.logger.debug(`Removendo usuário: ${id} (${existingUser.email})`);
    await this.userRepository.delete(id);
    this.logger.log(`Usuário ${id} removido com sucesso`);
  }
}
