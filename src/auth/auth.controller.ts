import {
  Controller,
  Post,
  UseGuards,
  Body,
  Res,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDto, UserLoginDto } from 'src/users/dto/create-user.dto';
import { Request, Response } from 'express';
import { IUser } from 'src/users/users.interface';
import { RolesService } from 'src/roles/roles.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './google-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth') //  route /
@ApiTags('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private rolesService: RolesService,
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
    return { user };
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
  async googleLogin() {
    // Đây sẽ redirect đến Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  // async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
  //   const user = await this.authService.login(req.user, res);
  //   console.log('user google: ', user);
  //   console.log('check req.user', req.user);
  //   res.redirect(`http://localhost:5173?token=${user.access_token}`);
  // }
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const user = req.user;
    const userRole = user.role as unknown as { _id: string; name: string };
    const roleData = await this.rolesService.findOne(userRole._id);
    console.log('check user: ', user);
    const updatedUser = {
      ...user,
      role: {
        _id: userRole._id,
        name: roleData.name,
      },
      permissions: roleData.permissions || [],
    };

    console.log('updatedUser: ', updatedUser);

    const responseUser = await this.authService.login(updatedUser, res);

    res.redirect(`http://localhost:5173?token=${responseUser.access_token}`);
  }
}
