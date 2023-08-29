import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/model/user.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signup(user: User): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);

    const reqBody = {
      fullname: user.fullname,
      email: user.email,
      password: hash,
    };

    const newUser = new this.userModel(reqBody);
    return await newUser.save();
  }

  async signIn(user: User, jwt: JwtService): Promise<any> {
    const foundUser = await this.userModel
      .findOne({ email: user.email })
      .exec();

    if (!foundUser) {
      return new HttpException(
        'Incorrect username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { password } = foundUser;

    if (bcrypt.compare(user.password, password)) {
      const payload = { email: user.email };

      return {
        token: jwt.sign(payload),
      };
    }

    return new HttpException(
      'Incorrect username or password',
      HttpStatus.UNAUTHORIZED,
    );
  }

  async getOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email });
  }
}
