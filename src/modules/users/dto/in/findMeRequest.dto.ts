import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class FindMeRequestDto {
   @IsNotEmpty()
   @IsString()
   id: string;

   @IsNotEmpty()
   @IsString()
   name: string;

   @IsNotEmpty()
   @IsEmail()
   email: string;

   @IsNotEmpty()
   @IsEnum(['USER', 'ADMIN'])
   role: 'USER' | 'ADMIN';

   @IsNotEmpty()
   @Type(() => Date)
   @IsDate()
   createdAt: Date;

   @IsNotEmpty()
   @Type(() => Date)
   @IsDate()
   updatedAt: Date;
}

