import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'Name không được để trống' })
  @IsString({ message: 'Name phải là chuỗi' })
  name: string;

  @IsNotEmpty({ message: 'Address không được để trống' })
  @IsString({ message: 'Address phải là chuỗi' })
  address: string;

  @IsNotEmpty({ message: 'Description không được để trống' })
  description: string;

  @IsNotEmpty({ message: 'Scale không được để trống' })
  @IsInt({ message: 'Scale phải là số nguyên!' })
  scale: number;

  @IsNotEmpty({ message: 'Logo không được để trống' })
  @IsString({ message: 'Logo phải là chuỗi' })
  logo: string;

  @IsNotEmpty({ message: 'Background không được để trống' })
  @IsString({ message: 'Background phải là chuỗi' })
  background: string;
}
