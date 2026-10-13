import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { HeroImagesService } from './hero-images.service';
import { CreateHeroImageDto } from './dto/create-hero-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../audit/audit.decorator';

@Controller('hero-images')
export class HeroImagesController {
  constructor(private readonly heroImagesService: HeroImagesService) {}

  // Public — the homepage itself needs to read these with no auth at all.
  @Get()
  findAll() {
    return this.heroImagesService.findAll();
  }

  @Post()
  @Audit('hero_image.added', { targetType: 'hero_image' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateHeroImageDto) {
    return this.heroImagesService.create(dto);
  }

  @Delete(':id')
  @Audit('hero_image.deleted', { targetType: 'hero_image' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.heroImagesService.remove(id);
  }
}