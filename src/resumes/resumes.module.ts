import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Resume, ResumeSchema } from './schemas/resume.schemas';
import { UsersModule } from 'src/users/users.module';
import { JobsModule } from 'src/jobs/jobs.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [ResumesController],
  providers: [ResumesService],
  imports: [
    UsersModule,
    JobsModule,
    MailModule,
    MongooseModule.forFeature([{ name: Resume.name, schema: ResumeSchema }]),
  ],
})
export class ResumesModule {}
