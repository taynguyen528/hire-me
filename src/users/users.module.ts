import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Role, RoleSchema } from 'src/roles/schemas/role.schemas';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { MailModule } from 'src/mail/mail.module';
import { SubscribersModule } from 'src/subscribers/subscribers.module';
import { JobsModule } from 'src/jobs/jobs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    JwtModule.register({
      secret: 'backend-recruitment',
      signOptions: { expiresIn: '1d' },
    }),
    SubscribersModule,
    JobsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, MailService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
