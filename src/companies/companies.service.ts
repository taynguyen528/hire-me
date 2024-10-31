import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './schemas/company.schemas';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: SoftDeleteModel<CompanyDocument>, // phải khai báo companyModel vào file module
    private configService: ConfigService,
  ) {}

  // coppy hết dữ liệu truyền lên : ...createCompanyDto
  create(createCompanyDto: CreateCompanyDto, user: IUser) {
    const scaleMin = this.configService.get<number>('SCALE_MIN');
    const scaleMax = this.configService.get<number>('SCALE_MAX');

    if (
      createCompanyDto.scale < scaleMin ||
      createCompanyDto.scale > scaleMax
    ) {
      throw new BadRequestException(
        `Số lượng nhân viên phải nằm trong khoảng từ ${scaleMin} đến ${scaleMax}`,
      );
    }

    return this.companyModel.create({
      ...createCompanyDto,
      createBy: { _id: user._id, email: user.email },
    });
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.companyModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.companyModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
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
      throw new BadRequestException(`not found company with id=${id}`);
    }
    return await this.companyModel.findById(id);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: IUser) {
    return await this.companyModel.updateOne(
      { _id: id },
      {
        ...updateCompanyDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
  }

  async remove(id: string, user: IUser) {
    await this.companyModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
        // isDeleted: true,
        // deletedAt: new Date(),
      },
    );
    return this.companyModel.softDelete({
      _id: id,
    });
  }
}
