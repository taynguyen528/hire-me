import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User as UserM, UserDocument } from './schemas/user.schema';
import mongoose from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from './users.interface';
import { User } from 'src/decorator/customize';
import aqp from 'api-query-params';
import { USER_ROLE } from 'src/databases/sample';
import { Role, RoleDocument } from 'src/roles/schemas/role.schemas';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,

    @InjectModel(UserM.name)
    private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  async create(createUserDto: CreateUserDto, @User() user: IUser) {
    const { name, email, password, birthday, gender, address, role, company } =
      createUserDto;

    // check email
    const isExist = await this.userModel.findOne({ email });
    if (isExist) {
      throw new BadRequestException(
        `Email: ${email} đã tồn tại trên hệ thống. Vui lòng sử dụng email khác!`,
      );
    }

    const hashPassword = this.getHashPassword(password);

    const newUser = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      birthday,
      gender,
      address,
      role,
      company,
      createBy: {
        _id: user._id,
        email: user.email,
      },
    });
    return newUser;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .select('-password')
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems, // tổng số phần tử (số bản ghi)
      },
      result, //kết quả query
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'not found user';
    }

    return await this.userModel
      .findOne({
        _id: id,
      })
      .select('-password')
      .populate({
        path: 'role',
        select: { name: 1, _id: 1 },
      }); //exclude >< include
  }

  findOneByEmail(email: string) {
    return this.userModel
      .findOne({
        email,
      })
      .populate({
        path: 'role',
        select: {
          name: 1,
        },
      });
  }

  isValidPassword(password: string, hashPassword: string) {
    return compareSync(password, hashPassword);
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    const updated = await this.userModel.updateOne(
      { _id: updateUserDto._id },
      {
        ...updateUserDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return updated;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'not found user';
    }

    const foundUser = await this.userModel.findById(id);
    if (foundUser && foundUser.email === 'pttnguyen528@gmail.com') {
      throw new BadRequestException('Không thể xóa tài khoản của admin');
    }

    await this.userModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    return this.userModel.softDelete({
      _id: id,
    });
  }

  async register(user: RegisterUserDto) {
    const { name, email, password } = user;
    // check email
    const isExist = await this.userModel.findOne({ email });
    if (isExist) {
      throw new BadRequestException(
        `Email: ${email} đã tồn tại trên hệ thống. Vui lòng sử dụng email khác!`,
      );
    }

    // fetch user role
    const userRole = await this.roleModel.findOne({ name: USER_ROLE });
    const hashPassword = this.getHashPassword(password);
    const tokenCheckVerify = await this.authService.createTokenVerify(
      user.email,
    );

    const newUser = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      role: userRole?._id,
      isVerify: false,
      tokenCheckVerify,
    });

    const verificationLink = `http://localhost:${this.configService.get<string>(
      'PORT_CLIENT',
    )}/verify-email?token=${tokenCheckVerify}`;
    await this.mailService.sendEmail(
      newUser.email,
      'Verify your account',
      'verify-email.hbs',
      { verification_link: verificationLink, name: newUser.name },
    );

    return newUser;
  }

  async createFromGoogle(
    email: string,
    name: string,
    gender: string,
    picture: string,
  ) {
    const isExist = await this.userModel.findOne({ email });
    if (isExist) {
      throw new BadRequestException(
        `Email: ${email} đã tồn tại trên hệ thống. Vui lòng sử dụng email khác!`,
      );
    }

    const password = '123456';
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);

    const userRole = await this.roleModel.findOne({ name: USER_ROLE });

    if (!userRole) {
      throw new BadRequestException('Role không tồn tại');
    }

    const tokenCheckVerify = await this.authService.createTokenVerify(email);

    const newUser = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      gender,
      picture,
      isVerify: false,
      tokenCheckVerify,
      role: userRole?._id,
    });

    return newUser;
  }

  updateUserToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne({ _id }, { refreshToken });
  };

  findUserByToken = async (refreshToken: string) => {
    return await this.userModel
      .findOne({ refreshToken })
      .populate({ path: 'role', select: { name: 1 } });
  };

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống.');
    }

    const resetPasswordToken = await this.authService.createTokenResetPassword(
      email,
    );

    await this.userModel.updateOne(
      {
        _id: user._id,
      },
      { resetPasswordToken },
    );

    const resetLink = `http://localhost:${this.configService.get<string>(
      'PORT_CLIENT',
    )}/reset-password?token=${resetPasswordToken}`;

    await this.mailService.sendEmail(
      user.email,
      'Reset password',
      'reset-password.hbs',
      { reset_link: resetLink, name: user.name },
    );
  }

  async resetPassword(tokenResetPassword: string, newPassword: string) {
    let payload: { email: string; iat: string; exp: string };
    try {
      payload = this.jwtService.verify(tokenResetPassword, {
        secret: this.configService.get<string>('JWT_FORGOT_PASSWORD_SECRET'),
      });
    } catch (error) {
      throw new BadRequestException(
        'Token không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.',
      );
    }
    const email = payload.email;
    const user = await this.userModel.findOne({ email });

    const hashedPassword = await this.getHashPassword(newPassword);
    user.password = hashedPassword;
    user.resetPasswordToken = '';
    await user.save();

    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }
}
