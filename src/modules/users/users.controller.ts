import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async findMe(@CurrentUser() user: AuthenticatedUser): Promise<FindMeResponseDto> {
    return this.usersService.findMe(user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findMany(
    @Query() findManyUserDto: FindManyRequestDto,
  ): Promise<FindManyResponseDto> {
    return this.usersService.findMany(findManyUserDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string
  ): Promise<FindOneResponseDto> {
    return this.usersService.findOne(id);
  }

  @Post('admin')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateRequestDto): Promise<CreateResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Patch('admin/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateRequestDto
  ): Promise<UpdateResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('admin/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string
  ): Promise<void> {
    await this.usersService.remove(id);
  }
}
