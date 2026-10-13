import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateAccountDto } from '../listings/dto/update-account.dto';
import { UpdateRoleDto } from '../listings/dto/update-role.dto';
import { UpdateBanDto } from '../listings/dto/update-ban.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../audit/audit.decorator';

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

  @Delete('me/account')
  @Audit('account.deleted', { targetType: 'user' })
  @UseGuards(JwtAuthGuard)
  deleteMyAccount(@Req() req) {
    return this.usersService.deleteAccount(req.user.userId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAllForAdmin();
  }

  @Patch('users/:id/role')
  @Audit('user.role_changed', { targetType: 'user', bodyFields: ['role'] })
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

  @Patch('users/:id/ban')
  @Audit('user.ban_changed', { targetType: 'user', bodyFields: ['isBanned'] })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateBanStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBanDto,
    @Req() req,
  ) {
    return this.usersService.setBanned(id, dto, req.user.userId);
  }
}
