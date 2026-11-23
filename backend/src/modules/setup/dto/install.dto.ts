// install.dto.ts -- request body of POST /setup/install.
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { PasswordRules } from '../../auth/dto/password-rules.decorator';

export class InstallDto {
  // The one-time code that install.sh prints in the server terminal (SETUP_CODE in .env).
  @IsString()
  @MinLength(16)
  @MaxLength(128)
  setupCode: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  // Same policy as register / reset-password (8+ chars, an uppercase letter, a number).
  @PasswordRules()
  password: string;
}
