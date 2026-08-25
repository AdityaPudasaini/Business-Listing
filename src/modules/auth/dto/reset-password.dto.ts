// reset-password.dto.ts — validates the /auth/reset-password request body.
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @MinLength(6)
  newPassword: string;
}
