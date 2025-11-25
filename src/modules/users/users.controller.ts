import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateRequestDto } from './dto/in/createRequest.dto';
import { UpdateRequestDto } from './dto/in/updateRequest.dto';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { FindMeResponseDto } from './dto/out/findMeResponse.dto';
import { FindOneResponseDto } from './dto/out/findOneResponse.dto';
import { FindManyResponseDto } from './dto/out/findManyResponse.dto';
import { CreateResponseDto } from './dto/out/createResponse.dto';
import { UpdateResponseDto } from './dto/out/updateResponse.dto';
import { FindManyRequestDto } from './dto/in/findManyRequest.dto';
import type { AuthenticatedUser } from '@shared/types/authenticated-user.type';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async findMe(@CurrentUser() user: AuthenticatedUser): Promise<FindMeResponseDto> {
    this.logger.log(`👤 Fetching profile for user: ${user.id}`);
    const result = await this.usersService.findMe(user);
    this.logger.log(`✅ Profile fetched for user: ${user.id}`);
    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findMany(
    @Query() findManyUserDto: FindManyRequestDto,
  ): Promise<FindManyResponseDto> {
    this.logger.log(`📋 Listing users - Page: ${findManyUserDto.page}, Limit: ${findManyUserDto.limit}`);
    const result = await this.usersService.findMany(findManyUserDto);
    this.logger.log(`✅ Found ${result.payload.length} users (Total: ${result.meta.total})`);
    return result;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string
  ): Promise<FindOneResponseDto> {
    this.logger.log(`🔍 Fetching user by ID: ${id}`);
    const result = await this.usersService.findOne(id);
    this.logger.log(`✅ User found: ${id}`);
    return result;
  }

  @Post('admin')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateRequestDto): Promise<CreateResponseDto> {
    this.logger.log(`➕ Creating new user with email: ${createUserDto.email}`);
    const result = await this.usersService.create(createUserDto);
    this.logger.log(`✅ User created successfully: ${result.id}`);
    return result;
  }

  @Patch('admin/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateRequestDto
  ): Promise<UpdateResponseDto> {
    this.logger.log(`✏️ Updating user: ${id}`);
    const result = await this.usersService.update(id, updateUserDto);
    this.logger.log(`✅ User updated successfully: ${id}`);
    return result;
  }

  @Delete('admin/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string
  ): Promise<void> {
    this.logger.log(`🗑️ Deleting user: ${id}`);
    await this.usersService.remove(id);
    this.logger.log(`✅ User deleted successfully: ${id}`);
  }
}
