// send-broadcast.dto.ts — validates the body of POST /admin/broadcasts
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendBroadcastDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;
}