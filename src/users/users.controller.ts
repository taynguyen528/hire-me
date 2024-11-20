import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import {
  Public,
  ResponseMessage,
  SkipCheckPermission,
  User,
} from 'src/decorator/customize';
import { IUser } from './users.interface';
import { ApiTags } from '@nestjs/swagger';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ResponseMessage('Create a new user')
  async create(@Body() createUserDto: CreateUserDto, @User() user: IUser) {
    let newUser = await this.usersService.create(createUserDto, user);
    return {
      _id: newUser?._id,
      createdAt: newUser?.createdAt,
    };
  }

  @Get('/profile')
  @SkipCheckPermission()
  @ResponseMessage('Get profile')
  async getProfile(@Req() req) {
    const email = req.user.email;
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      avatar: user.avatar,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      isVerify: user.isVerify,
      isPremium: user.isPremium,
      skills: user.skills,
      gender: user.gender,
      myCV: user.myCV,
    };
  }

  @Get()
  @ResponseMessage('Fetch user with paginate')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.usersService.findAll(+currentPage, +limit, qs);
  }

  @Public()
  @ResponseMessage('Fetch user by id')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // const id: string = req.params.id
    const foundUser = await this.usersService.findOne(id);
    return foundUser;
  }

  @SkipCheckPermission()
  @ResponseMessage('Update a user')
  @Patch(':id')
  //@User() user: IUser dựa vào đây để biết ai là người cập nhật User
  update(
    @Body() updateUserDto: UpdateUserDto,
    @User() user: IUser,
    @Param('id') id: string,
  ) {
    let updateUser = this.usersService.update(updateUserDto, user, id);
    return updateUser;
  }

  @ResponseMessage('Delete a User')
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.remove(id, user);
  }

  @SkipCheckPermission()
  @Post('update-password')
  @ResponseMessage('Update password successfully')
  async updatePassword(
    @Body('email') email: string,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @User() user: IUser,
  ) {
    return this.usersService.updatePassword(
      email,
      currentPassword,
      newPassword,
      user,
    );
  }

  @Public()
  @Post('forgot-password')
  @ResponseMessage('Password reset request successful')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @ResponseMessage('Reset password successful')
  async resetPassword(
    @Body('token') tokenResetPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.resetPassword(tokenResetPassword, newPassword);
  }

  @Post('set-premium')
  @ResponseMessage('Set premium')
  @SkipCheckPermission()
  async setPremium(@Body('typePre') typePre: string, @Req() req) {
    return this.usersService.setPremium(typePre, req.user.email);
  }
}
