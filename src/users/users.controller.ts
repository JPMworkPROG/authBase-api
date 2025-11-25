import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateRequestDto } from './dto/in/createRequest.dto';
import { UpdateRequestDto } from './dto/in/updateRequest.dto';
import { JwtAuthGuard } from '../common/guards/jwtAuth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/currentUser.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FindMeRequestDto } from './dto/in/findMeRequest.dto';
import { FindMeResponseDto } from './dto/out/findMeResponse.dto';
import { FindOneResponseDto } from './dto/out/findOneResponse.dto';
import { FindManyResponseDto } from './dto/out/findManyResponse.dto';
import { CreateResponseDto } from './dto/out/createResponse.dto';
import { UpdateResponseDto } from './dto/out/updateResponse.dto';
import { FindManyRequestDto } from './dto/in/findManyRequest.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async findMe(@CurrentUser() user: FindMeRequestDto): Promise<FindMeResponseDto> {
    this.logger.log(`Buscando perfil do usuário: ${user.id}`);
    const result = await this.usersService.findMe(user);
    this.logger.log(`Perfil do usuário ${user.id} encontrado com sucesso`);
    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findMany(
    @Query() findManyUserDto: FindManyRequestDto,
  ): Promise<FindManyResponseDto> {
    this.logger.log(`Buscando usuários com filtros: ${JSON.stringify(findManyUserDto)}`);
    const result = await this.usersService.findMany(findManyUserDto);
    this.logger.log(`Encontrados ${result.payload.length} usuário(s) de ${result.meta.total} total`);
    return result;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string
  ): Promise<FindOneResponseDto> {
    this.logger.log(`Buscando usuário por ID: ${id}`);
    const result = await this.usersService.findOne(id);
    this.logger.log(`Usuário ${id} encontrado com sucesso`);
    return result;
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateRequestDto): Promise<CreateResponseDto> {
    this.logger.log(`Criando novo usuário com email: ${createUserDto.email}`);
    const result = await this.usersService.create(createUserDto);
    this.logger.log(`Usuário criado com sucesso: ${result.id} (${result.email})`);
    return result;
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateRequestDto
  ): Promise<UpdateResponseDto> {
    this.logger.log(`Atualizando usuário: ${id}`);
    const result = await this.usersService.update(id, updateUserDto);
    this.logger.log(`Usuário ${id} atualizado com sucesso`);
    return result;
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string
  ): Promise<void> {
    this.logger.log(`Removendo usuário: ${id}`);
    await this.usersService.remove(id);
    this.logger.log(`Usuário ${id} removido com sucesso`);
  }
}
