//data transfer object // class = {}
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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

  @IsNotEmpty({ message: 'Phone không được để trống!' })
  phone: string;

  @IsNotEmpty({ message: 'Date of birth không thể để trống!' })
  dateOfBirth: string;

  @IsOptional()
  @IsArray({ message: 'Skills phải là một mảng!' })
  @ArrayMinSize(1, { message: 'Skills phải có ít nhất một giá trị!' })
  @IsIn(
    [
      'html',
      'css',
      'javascript',
      'typescript',
      'backend',
      'frontend',
      'fullstack',
      'reactjs',
      'vuejs',
      'docker',
      'nextjs',
      'angular',
      'java',
      'sass',
      'less',
      'tailwindcss',
      'bootstrap',
      'nodejs',
      'expressjs',
      'nestjs',
      'php',
      'laravel',
      'rubyonrails',
      'django',
      'springboot',
      'aspnet',
      'reactnative',
      'flutter',
      'swift',
      'kotlin',
      'javaandroid',
      'objectivec',
      'aws',
      'azure',
      'googlecloudplatform',
      'kubernetes',
      'cicd',
      'jenkins',
      'gitlabci',
      'mysql',
      'postgresql',
      'mongodb',
      'redis',
      'oracle',
      'sqlserver',
      'sqlite',
      'cybersecurity',
      'python',
      'tensorflow',
      'pytorch',
      'scikitlearn',
      'datascience',
      'machinelearning',
      'solidity',
      'web3js',
      'ethereum',
      'selenium',
      'junit',
      'tester',
      'mocha',
      'chai',
      'jest',
      'cypress',
    ],
    { each: true, message: 'Skills chỉ được chứa các giá trị hợp lệ!' },
  )
  skills: string[];

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
