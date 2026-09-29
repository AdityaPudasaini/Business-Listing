import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { PopupAdService } from './popup-ad.service';
import { UpdatePopupAdDto } from './dto/update-popup-ad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('popup-ad')
export class PopupAdController {
  constructor(private readonly popupAdService: PopupAdService) {}

  // Public — every visitor's browser reads this on the homepage.
  @Get()
  get() {
    return this.popupAdService.get();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  save(@Body() dto: UpdatePopupAdDto) {
    return this.popupAdService.save(dto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove() {
    return this.popupAdService.remove();
  }
}
