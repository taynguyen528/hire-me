import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { Public } from './decorator/customize';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller() //  route /
export class AppController {
  constructor(
    private readonly appService: AppService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}
}
