import {
   IsString,
   Matches,
   MaxLength,
   MinLength,
} from 'class-validator';

export class ResetPasswordRequestDto {
   @IsString()
   token: string;

   @IsString()
   @MinLength(8)
   @MaxLength(128)
   @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message:
         'Password must contain at least 1 lowercase, 1 uppercase, 1 number and 1 special character',
   })
   newPassword: string;
}

