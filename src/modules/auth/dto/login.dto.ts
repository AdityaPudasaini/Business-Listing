// login.dto.ts — defines and validates the shape of the /auth/login request body.
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
