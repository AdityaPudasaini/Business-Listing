// send-announcement.dto.ts — validates the body of POST /businesses/:id/announcements
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  // Optional list of User ids to restrict the send to (matches the frontend's
  // recipient checkboxes). Omit to send to every customer with an email on file.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customerIds?: string[];
}