import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';


@Injectable()
export class FilesService {
  constructor(private userService: UsersService) {}

  async upload(file: Express.Multer.File) {
    return { fileName: file.filename };
  }

  async uploadAvatar(file: Express.Multer.File, email: string) {
    const user = await this.userService.findOneByEmail(email);

    if (user) {
      user.avatar = file.filename;
      await user.save();
    }
    return { fileName: user.avatar };
  }

  async uploadMyResume(file: Express.Multer.File, email: string) {
    const user = await this.userService.findOneByEmail(email);

    if (user) {
      user.myCV.push(file.filename);
      await user.save();
    }
    return { fileName: file.filename, myCV: user.myCV };
  }
}
