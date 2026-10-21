// password-rules.decorator.ts -- one place for the password policy, so register and
// reset-password can never drift apart. Mirrors the frontend rules in
// frontend/src/lib/validation (8+ characters, an uppercase letter, a number).
// MaxLength(72): bcrypt silently ignores everything past 72 bytes.
import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export function PasswordRules() {
  return applyDecorators(
    IsString(),
    MinLength(8, { message: 'Password must be at least 8 characters.' }),
    MaxLength(72, { message: 'Password must be at most 72 characters.' }),
    Matches(/^(?=.*[A-Z])(?=.*[0-9]).+$/, {
      message: 'Password needs at least one uppercase letter and one number.',
    }),
  );
}
