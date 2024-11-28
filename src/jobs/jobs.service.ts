import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Job, JobDocument } from './schemas/job.schemas';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>, // phải khai báo jobModel vào file module
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}
  async create(createJobDto: CreateJobDto, user: IUser) {
    const {
      name,
      skills,
      company,
      salary,
      quantity,
      level,
      description,
      workForm,
      startDate,
      endDate,
      isActive,
      location,
      gender,
      appliedCandidates,
      experience,
    } = createJobDto;
    const normalizedSkills = skills.map((skill) => skill.toLowerCase());

    let newJob = await this.jobModel.create({
      name,
      skills: normalizedSkills,
      company,
      salary,
      quantity,
      level,
      description,
      workForm,
      startDate,
      endDate,
      isActive,
      location,
      gender,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
      appliedCandidates,
      experience,
    });

    return {
      _id: newJob?._id,
      createdAt: newJob?.createdAt,
    };
  }

  async findAllWithPaginate(
    currentPage: number,
    limit: number,
    qs: string,
    email: string,
  ) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.jobModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.jobModel
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

  async findJobsByHr(
    email: string,
    currentPage: number,
    limit: number,
    qs: string,
  ) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user.company || !user.company._id) {
      throw new BadRequestException('HR must belong to a company to view jobs');
    }

    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    filter['company._id'] = user.company._id;

    const offset = (+currentPage - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.jobModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.jobModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: totalPages,
        total: totalItems,
      },
      result,
    };
  }

  async findAll() {
    const jobs = await this.jobModel.find().exec();
    return jobs;
  }


  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID');
    }

    const job = await this.jobModel.findById(id);
    if (!job) {
      throw new BadRequestException('Job not found');
    }

    return job;
  }

  async update(id: string, updateJobDto: Partial<UpdateJobDto>, user: IUser) {
    const updatedJob = await this.jobModel.findByIdAndUpdate(
      id,
      {
        ...updateJobDto,
        updatedBy: { _id: user._id, email: user.email },
      },
      { new: true },
    );
    return updatedJob;
  }

  async remove(id: string, user: IUser) {
    await this.jobModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return this.jobModel.softDelete({
      _id: id,
    });
  }

  async findJobsByCompany(companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return `Invalid company ID`;
    }

    const jobs = await this.jobModel.find({ 'company._id': companyId }).exec();
    return jobs;
  }

  async findJobsBySkills(skills: string[]) {
    if (!skills || skills.length === 0) {
      return `No skills provided`;
    }

    const jobs = await this.jobModel
      .find({
        skills: { $in: skills },
      })
      .exec();

    return jobs;
  }
}
