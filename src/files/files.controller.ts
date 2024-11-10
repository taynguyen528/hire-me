import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  UseFilters,
  Req,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  Public,
  ResponseMessage,
  SkipCheckPermission,
} from 'src/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from 'src/core/http-exceptions.filter';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Public()
  @Post('upload')
  @ResponseMessage('Upload single file')
  @UseInterceptors(FileInterceptor('fileUpload'))
  @UseFilters(new HttpExceptionFilter())
  uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.filesService.upload(file);
  }

  @Post('upload-avatar')
  @SkipCheckPermission()
  @ResponseMessage('Upload user avatar')
  @UseInterceptors(FileInterceptor('fileUpload'))
  @UseFilters(new HttpExceptionFilter())
  uploadAvatar(
    @Req() req,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.filesService.uploadAvatar(file, req.user.email);
  }

  @Post('upload-resume')
  @SkipCheckPermission()
  @ResponseMessage('Upload user resume')
  @UseInterceptors(FileInterceptor('fileUpload'))
  @UseFilters(new HttpExceptionFilter())
  uploadResume(
    @Req() req,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.filesService.uploadMyResume(file, req.user.email);
  }
}
