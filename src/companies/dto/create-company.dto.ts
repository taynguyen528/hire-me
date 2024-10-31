import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'Name không được để trống' })
  name: string;

  @IsNotEmpty({ message: 'Address không được để trống' })
  address: string;

  @IsNotEmpty({ message: 'Description không được để trống' })
  description: string;

  @IsNotEmpty({ message: 'Scale không được để trống' })
  @IsInt({ message: 'Scale phải là số nguyên!' })
  scale: number;

  @IsNotEmpty({ message: 'Logo không được để trống' })
  logo: string;
}
