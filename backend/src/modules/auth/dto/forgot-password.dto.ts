// forgot-password.dto.ts — validates the /auth/forgot-password request body.
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
