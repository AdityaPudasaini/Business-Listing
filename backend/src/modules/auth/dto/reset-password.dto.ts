// reset-password.dto.ts — validates the /auth/reset-password request body.
import { IsString } from 'class-validator';
import { PasswordRules } from './password-rules.decorator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @PasswordRules()
  newPassword: string;
}
