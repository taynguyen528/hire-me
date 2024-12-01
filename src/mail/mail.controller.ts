import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import {
  Public,
  ResponseMessage,
  SkipCheckPermission,
} from 'src/decorator/customize';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  @Public()
  @SkipCheckPermission()
  @Cron(CronExpression.EVERY_WEEK)
  @ResponseMessage('Send job')
  async handleSendJobs() {
    const result = await this.mailService.sendJobEmails();
    return {
      message: 'Send job completed',
      result,
    };
  }
}
