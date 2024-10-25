import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';

@Controller('jobs')
@ApiTags('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ResponseMessage('Create a new job')
  create(@Body() createJobDto: CreateJobDto, @User() user: IUser) {
    return this.jobsService.create(createJobDto, user);
  }

  @Get()
  @Public()
  @ResponseMessage('Fetch jobs with pagination')
  findAllWithPaginate(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.jobsService.findAllWithPaginate(+currentPage, +limit, qs);
  }

  @Get('/getAllJobs')
  @Public()
  @ResponseMessage('Fetch all jobs')
  findAll() {
    return this.jobsService.findAll();
  }

  @Post('/searchBySkills')
  @Public()
  @ResponseMessage('Fetch jobs by skills')
  fetchJobWithSkills(@Body('skills') skills: string[]) {
    return this.jobsService.findJobsBySkills(skills);
  }

  @Get('/company/:companyId')
  @Public()
  @ResponseMessage('Fetch all jobs by company ID')
  findJobsByCompany(@Param('companyId') companyId: string) {
    return this.jobsService.findJobsByCompany(companyId);
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Fetch job by id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Update a job')
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @User() user: IUser,
  ) {
    return this.jobsService.update(id, updateJobDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete a job')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.jobsService.remove(id, user);
  }
}
