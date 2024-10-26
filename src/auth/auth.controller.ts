import {
  Controller,
  Post,
  UseGuards,
  Body,
  Res,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDto, UserLoginDto } from 'src/users/dto/create-user.dto';
import { Request, Response } from 'express';
import { IUser, Permission } from 'src/users/users.interface';
import { RolesService } from 'src/roles/roles.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './google-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth') //  route /
@ApiTags('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private rolesService: RolesService,
    private configService: ConfigService,
  ) {}

  @Public() // tag @Public để không cần dùng jwt
  @UseGuards(LocalAuthGuard)
  @UseGuards(ThrottlerGuard)
  @ApiBody({ type: UserLoginDto })
  @Post('/login')
  @ResponseMessage('User Login')
  handleLogin(@Req() req, @Res({ passthrough: true }) response: Response) {
    // console.log(req.user);
    return this.authService.login(req.user, response);
  }

  @Public()
  @ResponseMessage('Register a new user')
  @Post('/register')
  handleRegister(@Body() registerUserDto: RegisterUserDto) {
    // console.log(registerUserDto);
    return this.authService.register(registerUserDto);
  }

  @ResponseMessage('Get user information')
  @Get('/account')
  async handleGetAccount(@User() user: IUser) {
    //req.user
    // console.log(user);
    const temp = (await this.rolesService.findOne(user.role._id)) as any;
    user.permissions = temp.permissions;
    return user;
  }

  @Public()
  @ResponseMessage('Get user by refresh token')
  @Get('/refresh')
  handleRefreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'];
    // return { refreshToken };
    return this.authService.processNewToken(refreshToken, response);
  }

  @ResponseMessage('Logout user')
  @Post('/logout')
  handleLogout(
    @Res({ passthrough: true }) response: Response,
    @User() user: IUser,
  ) {
    return this.authService.logout(response, user);
  }

  // Google oauth 2.0
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin(@Req() req, @Res() res) {
    return res.redirect(
      `http://localhost:${this.configService.get<string>(
        'PORT_CLIENT',
      )}/auth/google/callback`,
    );
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const user = req.user;
    const userRole = user.role as unknown as { _id: string; name: string };
    const roleData = await this.rolesService.findOne(userRole._id);

    const { _id, name, email } = user._doc;

    const permissions: Permission[] = (roleData.permissions || []).map(
      (permission: any) => ({
        _id: permission._id,
        name: permission.name,
        apiPath: permission.apiPath,
        module: permission.module,
      }),
    );

    const updatedUser: IUser = {
      _id: _id.toString(),
      name,
      email,
      role: {
        _id: userRole._id.toString(),
        name: roleData.name,
      },
      permissions,
    };

    const responseUser = await this.authService.login(updatedUser, res);

    const clientPort = this.configService.get<string>('PORT_CLIENT');
    const redirectUrl = `http://localhost:${clientPort}?token=${responseUser.access_token}&isLogin=true`;

    res.redirect(redirectUrl);
  }

  @Public()
  @ResponseMessage('Account verified successfully.')
  @Get('verify-email')
  async verify(@Query('tokenCheckVerify') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @Public()
  @ResponseMessage('Resend email verify email successfully.')
  @Get('resend-verify-email')
  async resendVerifyEmail(@Query('email') email: string) {
    return await this.authService.resendEmailVerifyEmail(email);
  }
}
