// register.dto.ts — defines and validates the shape of the /auth/register request body.
import { IsEmail, IsString } from 'class-validator';
import { PasswordRules } from './password-rules.decorator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @PasswordRules()
  password: string;
}
