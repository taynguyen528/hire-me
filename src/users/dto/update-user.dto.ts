import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsNotEmpty({ message: 'Name không được để trống!' })
  name: string;

  @IsNotEmpty({ message: 'Gender không được để trống!' })
  @IsString()
  gender: string;

  @IsNotEmpty({ message: 'Address không được để trống!' })
  @IsString()
  address: string;

  @IsNotEmpty({ message: 'Phone không được để trống!' })
  phone: string;

  @IsNotEmpty({ message: 'Date of birth không thể để trống!' })
  @IsString()
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
      'sass',
      'less',
      'tailwindcss',
      'bootstrap',
      'nodejs',
      'expressjs',
      'nestjs',
      'php',
      'laravel',
      'django',
      'springboot',
      'reactnative',
      'flutter',
      'swift',
      'kotlin',
      'aws',
      'docker',
      'mysql',
      'postgresql',
      'mongodb',
      'redis',
      'oracle',
      'sqlite',
      'python',
      'selenium',
    ],
    { each: true, message: 'Skills chỉ được chứa các giá trị hợp lệ!' },
  )
  skills: string[];
}
