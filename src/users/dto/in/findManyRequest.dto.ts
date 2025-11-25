import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class FindManyRequestDto {
   @IsNotEmpty()
   @Type(() => Number)
   @IsInt()
   @Min(1)
   @Max(1000)
   page: number;

   @IsNotEmpty()
   @Type(() => Number)
   @IsInt()
   @Min(1)
   @Max(100)
   limit: number;

   @IsOptional()
   @IsString()
   name?: string;

   @IsOptional()
   @IsString()
   email?: string;

   @IsOptional()
   @IsEnum(['USER', 'ADMIN'])
   role?: 'USER' | 'ADMIN';
}

