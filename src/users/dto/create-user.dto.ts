//data transfer object // class = {}
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

class Company {
  @IsNotEmpty()
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name không được để trống!' })
  name: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống!' })
  email: string;

  @IsNotEmpty({ message: 'Password không được để trống!' })
  password: string;

  @IsNotEmpty({ message: 'Birthday không được để trống!' })
  @IsString()
  birthday: string;

  @IsNotEmpty({ message: 'Gender không được để trống!' })
  gender: string;

  @IsNotEmpty({ message: 'Address không được để trống!' })
  address: string;

  @IsOptional()
  @IsString({ message: 'Avatar phải là một chuỗi!' })
  @Matches(/^(https?:\/\/.*\.(?:png|jpg|jpeg))$/, {
    message: 'Avatar phải là một URL hợp lệ của ảnh (png, jpg, jpeg)',
  })
  avatar: string;

  @IsOptional()
  @IsString({ message: 'isPremium phải là một chuỗi!' })
  @IsIn(['Lite', 'Plus', 'Max'], {
    message: 'isPremium chỉ có thể là một trong các giá trị: Lite, Plus, Max',
  })
  isPremium: string;

  @IsNotEmpty({ message: 'Role không được để trống!' })
  @IsMongoId({ message: 'Role có định dạng là mongo id' })
  role: mongoose.Schema.Types.ObjectId;

  //validate object => dùng package class-transformer
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Company)
  company!: Company;
}

export class RegisterUserDto {
  @IsNotEmpty({ message: 'Name không được để trống!' })
  name: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống!' })
  email: string;

  @IsNotEmpty({ message: 'Password không được để trống!' })
  password: string;
}

export class UserLoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'email', description: 'email' })
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'password',
    description: 'password',
  })
  readonly password: string;
}
