import { IsString, IsOptional, MaxLength } from 'class-validator';

export class StartChatDto {
  @IsString()
  businessId: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  visitorName?: string;
}