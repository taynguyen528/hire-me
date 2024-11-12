import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Response } from 'express';
import { RolesService } from 'src/roles/roles.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
    private rolesService: RolesService, // @InjectModel(User.name) // private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid === true) {
        const userRole = user.role as unknown as { _id: string; name: string };
        const temp = await this.rolesService.findOne(userRole._id);

        const objUser = {
          ...user.toObject(),
          permissions: temp?.permissions ?? [],
        };

        return objUser;
      }
    }
    return null;
  }

  generateJwtToken(user: IUser) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  async register(user: RegisterUserDto) {
    let newUser = await this.usersService.register(user);
    return {
      _id: newUser?._id,
      createdAt: newUser?.createdAt,
    };
  }

  async login(user: IUser, response: Response) {
    const {
      _id,
      name,
      email,
      role,
      permissions,
      address,
      avatar,
      phone,
      dateOfBirth,
    } = user;
    
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      name,
      email,
      role,
      // permissions,
      address,
      avatar,
      phone,
      dateOfBirth,
    };
    const refresh_token = this.createRefreshToken(payload);

    // update user with refresh token
    await this.usersService.updateUserToken(refresh_token, _id);

    // set refresh_token as cookie
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role,
        permissions,
        address,
        avatar,
        phone,
        dateOfBirth,
      },
    };
  }

  createRefreshToken = (payload: any) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')) / 1000,
    });
    return refresh_token;
  };

  processNewToken = async (refreshToken: string, response: Response) => {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      const user = await this.usersService.findUserByToken(refreshToken);
      if (user) {
        const { _id, name, email, role } = user;
        const payload = {
          sub: 'token refresh',
          iss: 'from server',
          _id,
          name,
          email,
          role,
        };
        const refresh_token = this.createRefreshToken(payload);

        // update user with refresh token
        await this.usersService.updateUserToken(refresh_token, _id.toString());

        // fetch user role
        const userRole = user.role as unknown as { _id: string; name: string };
        const temp = await this.rolesService.findOne(userRole._id);

        // set refresh_token as cookie
        response.clearCookie('refresh_token');

        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
        });

        return {
          access_token: this.jwtService.sign(payload),
          user: {
            _id,
            name,
            email,
            role,
            permissions: temp?.permissions ?? [],
          },
        };
      } else {
        throw new BadRequestException(
          `Refresh token không hợp lệ. Vui lòng login.`,
        );
      }
    } catch (error) {
      throw new BadRequestException(
        `Refresh token không hợp lệ. Vui lòng login.`,
      );
    }
  };

  async createTokenVerify(email: string) {
    return this.jwtService.sign(
      { email },
      {
        secret: this.configService.get<string>('JWT_VERIFY_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRE_1H'),
      },
    );
  }

  async createTokenResetPassword(email: string) {
    return this.jwtService.sign(
      { email },
      {
        secret: this.configService.get<string>('JWT_FORGOT_PASSWORD_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRE_1H'),
      },
    );
  }

  async verifyEmail(token: string) {
    try {
      const decoded: any = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_VERIFY_SECRET'),
      });
      const user = await this.usersService.findOneByEmail(decoded.email);

      if (!user) {
        throw new BadRequestException('User not found.');
      }

      user.isVerify = true;
      user.tokenCheckVerify = '';
      await user.save();
    } catch (error) {
      throw new BadRequestException(
        'Token xác minh không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async resendEmailVerifyEmail(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.isVerify === true && user.tokenCheckVerify === '') {
      throw new BadRequestException('Account has been verified');
    }

    const verifyToken = await this.createTokenVerify(email);
    user.tokenCheckVerify = verifyToken;
    await user.save();

    const verificationLink = `http://localhost:${this.configService.get<string>(
      'PORT_CLIENT',
    )}/verify-email?token=${verifyToken}`;
    await this.mailService.sendEmail(
      user.email,
      'Resend email verify email',
      'verify-email.hbs',
      { verification_link: verificationLink, name: user.name },
    );
  }

  logout = async (response: Response, user: IUser) => {
    await this.usersService.updateUserToken('', user._id);
    response.clearCookie('refresh_token');
    return 'Ok';
  };
}
