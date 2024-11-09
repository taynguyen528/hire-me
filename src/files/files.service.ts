import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FilesService {
  constructor(private userService: UsersService) {}
  async saveUserAvatar(file: Express.Multer.File, email: string) {
    const user = await this.userService.findOneByEmail(email);

    if (user) {
      user.avatar = file.filename;
      await user.save();
    }
    return { fileName: user.avatar };
  }
}
