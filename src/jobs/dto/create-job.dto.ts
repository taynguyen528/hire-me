import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

class Company {
  @IsNotEmpty()
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  logo: string;

  @IsNotEmpty()
  scale: string;
}

export class CreateJobDto {
  @IsNotEmpty({ message: 'Name không được để trống' })
  name: string;

  @IsNotEmpty({ message: 'Skills không được để trống' })
  @IsArray({ message: 'Skills phải có dạng array' })
  @IsString({ each: true, message: 'Skill phải là string' })
  @ArrayMinSize(1)
  skills: string[];

  // Validate object => dùng package class-transformer
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Company)
  company!: Company;

  @IsNotEmpty({ message: 'Location không được để trống' })
  location: string;

  @IsNotEmpty({ message: 'Salary không được để trống' })
  salary: number;

  @IsNotEmpty({ message: 'Quantity không được để trống' })
  quantity: number;

  @IsNotEmpty({ message: 'Level không được để trống' })
  level: string;

  @IsNotEmpty({ message: 'Experience không được để trống' })
  experience: string;

  @IsNotEmpty({ message: 'Description không được để trống' })
  description: string;

  @IsNotEmpty({ message: 'Work Form không được để trống' })
  @IsArray({ message: 'Work Form phải có dạng array' })
  @IsString({ each: true, message: 'Mỗi Work Form phải là string' })
  @IsIn(
    [
      'Full-time',
      'Part-time',
      'Remote',
      'Hybrid',
      'Freelance',
      'Contract-based',
      'On-site',
    ],
    {
      each: true,
      message:
        'Work Form phải thuộc các giá trị: Full-time, Part-time, Remote, Hybrid, Freelance, Contract-based, On-site',
    },
  )
  workForm: string[];

  @IsOptional()
  @IsString({ message: 'Gender phải là chuỗi' })
  gender?: string;

  @IsNotEmpty({ message: 'StartDate không được để trống' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'StartDate phải có định dạng là Date' })
  startDate: Date;

  @IsNotEmpty({ message: 'EndDate không được để trống' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'EndDate phải có định dạng là Date' })
  endDate: Date;

  @IsNotEmpty({ message: 'isActive không được để trống' })
  @IsBoolean({ message: 'isActive phải có định dạng là boolean' })
  isActive: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Số người ứng tuyển không được nhỏ hơn 0' })
  appliedCandidates?: number;
}
