import { IsBoolean } from 'class-validator';

export class UpdateBanDto {
  @IsBoolean()
  isBanned!: boolean;
}