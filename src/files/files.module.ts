import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.config';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
    UsersModule,
  ],
})
export class FilesModule {}
