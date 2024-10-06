import { BadRequestException, Injectable } from '@nestjs/common';
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
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,

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

    let newUser = await this.userModel.create({
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

    // Kiểm tra email đã tồn tại
    const isExist = await this.userModel.findOne({ email });
    if (isExist) {
      throw new BadRequestException(
        `Email: ${email} đã tồn tại trên hệ thống. Vui lòng sử dụng email khác!`,
      );
    }

    // Lấy vai trò người dùng
    const userRole = await this.roleModel.findOne({ name: USER_ROLE });
    const hashPassword = this.getHashPassword(password); // Hàm băm mật khẩu
    const tokenCheckVerify = this.createTokenVerify(email); // Tạo token xác thực

    // Tạo người dùng mới
    const newUser = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      role: userRole?._id,
      isVerify: false,
      tokenCheckVerify,
    });

    const verificationLink = `http://http://localhost:5173/verify-email?token=${tokenCheckVerify}`; // Đảm bảo bạn tạo liên kết xác thực đúng

    await this.mailService.sendEmail(
      newUser.email,
      'Xác nhận tài khoản của bạn',
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

    const newUser = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      gender,
      picture,
      role: userRole?._id,
    });

    return newUser;
  }

  private createTokenVerify(email: string) {
    return this.jwtService.sign(
      { email },
      {
        secret: this.configService.get<string>('JWT_VERIFY_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRE_1H'),
      },
    );
  }

  async verifyAccount(token: string) {
    try {
      const decoded: any = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_VERIFY_SECRET'),
      });
      const user = await this.findOneByEmail(decoded.email);

      if (!user) {
        throw new BadRequestException('Người dùng không tồn tại');
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

  updateUserToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne({ _id }, { refreshToken });
  };

  findUserByToken = async (refreshToken: string) => {
    return await this.userModel
      .findOne({ refreshToken })
      .populate({ path: 'role', select: { name: 1 } });
  };
}
