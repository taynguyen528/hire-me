import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Role, RoleSchema } from 'src/roles/schemas/role.schemas';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { MailService } from 'src/mail/mail.service';
import { JobsModule } from 'src/jobs/jobs.module';
import { SubscribersModule } from 'src/subscribers/subscribers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    JwtModule.register({
      secret: 'yourSecretKey',
      signOptions: { expiresIn: '1d' },
    }),
    forwardRef(() => AuthModule),
    SubscribersModule,
    JobsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, MailService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
