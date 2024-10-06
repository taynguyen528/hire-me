import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import {
  Subscriber,
  SubscriberDocument,
} from 'src/subscribers/schemas/subscriber.schemas';
import { Job, JobDocument } from 'src/jobs/schemas/job.schemas';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,

    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,

    @InjectModel(Job.name)
    private jobModal: SoftDeleteModel<JobDocument>,
  ) {}

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: object,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        from: '"Support Team" <support@example.com>',
        subject,
        template,
        context,
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendJobEmails() {
    const subscribers = await this.subscriberModel.find({});
    for (const subs of subscribers) {
      const subsSkills = subs.skills;
      const jobWithMatchingSkills = await this.jobModal.find({
        skills: { $in: subsSkills },
      });

      if (jobWithMatchingSkills?.length > 0) {
        const jobs = jobWithMatchingSkills.map((item) => {
          return {
            name: item.name,
            company: item.company.name,
            salary:
              `${item.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ',
            skills: item.skills,
          };
        });

        await this.sendEmail(
          'anguyenvan0236@gmail.com',
          'Welcome to Nice App! Confirm your Email',
          'new-jobs',
          {
            receiver: subs.name,
            jobs: jobs,
          },
        );
      }
    }
  }
}
