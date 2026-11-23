// setup.controller.ts -- first-run web installer.
//   GET  /setup/status    { installed } -- the /install page uses it to decide what to show
//   POST /setup/install   creates the first admin (needs SETUP_CODE; works once)
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SetupService } from './setup.service';
import { InstallDto } from './dto/install.dto';

@Controller('setup')
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  @Get('status')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  status() {
    return this.setup.status();
  }

  // 5 attempts a minute per IP: guessing a 16+ character code is hopeless, and this also
  // keeps the password hashing from being used to burn CPU.
  @Post('install')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  install(@Body() dto: InstallDto, @Req() req) {
    return this.setup.install(dto, { ip: req.ip, userAgent: req.headers?.['user-agent'] });
  }
}
