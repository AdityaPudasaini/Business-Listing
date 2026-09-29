import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Every field is optional so the admin page can flip "active" without
// re-sending the image. The service still refuses to create a first ad
// without an image.
export class UpdatePopupAdDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  image?: string;

  // Where the ad goes when clicked. Empty string = not clickable.
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/\S+)?$/, { message: 'Link must start with http:// or https://' })
  href?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
