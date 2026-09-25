import {
  IsArray,
  ArrayMaxSize,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GeneralChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message?: string;

  // Recent turns from the widget so the model has context. Untrusted input:
  // the service re-validates each entry and caps the length.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  history?: { from: string; text: string }[];

  // Visitor's browser geolocation, sent only when available/granted. Used for
  // "businesses closest to me"-style questions; every other intent ignores it.
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}