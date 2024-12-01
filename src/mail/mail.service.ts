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
        from: '"Support Team HireMe" <pttnguyen528@gmail.com>',
        subject,
        template,
        context,
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendJobEmails() {
    const users = await this.subscriberModel.find({ isDeleted: false });

    let emailCount = 0;

    for (const user of users) {
      const userSkills = user.skills;

      if (!userSkills || userSkills.length === 0) {
        continue;
      }

      const jobsMatchingSkills = await this.jobModal.find({
        skills: { $in: userSkills },
      });

      if (jobsMatchingSkills.length > 0) {
        const jobs = jobsMatchingSkills.map((job) => ({
          name: job.name,
          company: job.company.name,
          salary: `${job.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ',
          skills: job.skills,
          location: job.location,
        }));

        await this.sendEmail(
          user.email,
          'Công việc phù hợp với kỹ năng của bạn',
          'send-job-email',
          {
            receiver: user.name,
            jobs: jobs,
          },
        );
        emailCount++;
      } else {
        console.log(`No jobs found matching skills for user ${user.name}`);
      }
    }

    return `Emails sent: ${emailCount}`;
  }
}
