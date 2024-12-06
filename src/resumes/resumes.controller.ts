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
import { ResumesService } from './resumes.service';
import { CreateUserCvDto } from './dto/create-resume.dto';
import {
  ResponseMessage,
  SkipCheckPermission,
  User,
} from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';

@Controller('resumes')
@ApiTags('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  @SkipCheckPermission()
  @ResponseMessage('Create a new resume')
  create(@Body() createUserCvDto: CreateUserCvDto, @User() user: IUser) {
    return this.resumesService.create(createUserCvDto, user);
  }

  @Get()
  @ResponseMessage('Fetch all resumes with paginate')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
    @User() user: IUser,
  ) {
    return this.resumesService.findAll(+currentPage, +limit, qs);
  }

  @Get('by-hr')
  @SkipCheckPermission()
  @ResponseMessage('Fetch resumes for HR')
  findAllByHr(
    @User() user: IUser,
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string,
  ) {
    return this.resumesService.findAllByHr(
      user.email,
      +currentPage,
      +limit,
      qs,
    );
  }

  @Get(':id')
  @ResponseMessage('Fetch a resume by id')
  findOne(@Param('id') id: string) {
    return this.resumesService.findOne(id);
  }

  @Post('by-user')
  @SkipCheckPermission()
  @ResponseMessage('Get Resumes by User')
  getResumeByUser(@User() user: IUser) {
    return this.resumesService.findByUser(user);
  }

  @Patch(':id')
  @ResponseMessage('Update status resume')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @User() user: IUser,
  ) {
    return this.resumesService.update(id, status, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete a resume by id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.resumesService.remove(id, user);
  }
}
