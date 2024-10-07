import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { Cron } from '@nestjs/schedule';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  @Public()
  @ResponseMessage('Test email')
  @Cron('0 0 0 * * 0') // 0h 00p every sunday
  // @Cron("*/30 * * * * *") // Every 30 seconds
  async handleTestEmail() {
    await this.mailService.sendJobEmails(); // Delegate the job emails to MailService
  }
}
