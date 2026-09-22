import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateAccountDto } from '../listings/dto/update-account.dto';
import { UpdateRoleDto } from '../listings/dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Any logged-in user reads/edits their own account — no @Roles() needed,
  // JwtAuthGuard alone scopes this to req.user.userId.
  @Get('me/account')
  @UseGuards(JwtAuthGuard)
  getMyAccount(@Req() req) {
    return this.usersService.getAccount(req.user.userId);
  }

  @Patch('me/account')
  @UseGuards(JwtAuthGuard)
  updateMyAccount(@Req() req, @Body() dto: UpdateAccountDto) {
    return this.usersService.updateAccount(req.user.userId, dto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAllForAdmin();
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req,
  ) {
    return this.usersService.updateRole(
      id,
      dto.role,
      req.user.userId,
    );
  }
}