import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/decorator/customize';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,

    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    console.log('check profile: ', profile);
    const existingUser = await this.userModel.findOne({ emails });
    console.log('existingUser: ', existingUser);
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };
    ``;

    console.log('check user (google oauth 2.0): ', user);
    done(null, user);
  }
}

// async validateGoogleUser(user: any, res: Response): Promise<any> {
//   const { email } = user;
//   const existingUser = await this.userModel.findOne({ email });
//   console.log('existingUser: ', existingUser);
//   return existingUser;

//   let newUser;
//   if (!existingUser) {
//     newUser = await this.usersService.register({
//       name: `${user.firstName} ${user.lastName}`,
//       email: user.email,
//       role: 'guest',
//     });
//   } else {
//     newUser = existingUser;
//   }

//   const payload = {
//     _id: newUser._id,
//     name: newUser.name,
//     email: newUser.email,
//     role: newUser.role,
//   };

//   const accessToken = this.jwtService.sign(payload);

//   const refreshToken = this.createRefreshToken(payload);
//   await this.usersService.updateUserToken(refreshToken, newUser._id);

//   res.cookie('refresh_token', refreshToken, {
//     httpOnly: true,
//     maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
//   });

//   return {
//     access_token: accessToken,
//     user: {
//       _id: newUser._id,
//       name: newUser.name,
//       email: newUser.email,
//       role: newUser.role,
//     },
//   };
// }
