import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Role } from 'src/roles/schemas/role.schemas';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  age: number;

  @Prop()
  gender: string;

  @Prop()
  address: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop()
  phone: string;

  @Prop()
  dateOfBirth: string;

  @Prop({ type: Object })
  company: {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
  };

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Role.name })
  role: mongoose.Schema.Types.ObjectId;

  @Prop()
  refreshToken: string;

  @Prop({ type: Object })
  createBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  updatedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  deletedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({
    type: [String],
    enum: [
      'html',
      'css',
      'javascript',
      'typescript',
      'backend',
      'frontend',
      'fullstack',
      'reactjs',
      'vuejs',
      'docker',
      'nextjs',
      'angular',
      'java',
      'sass',
      'less',
      'tailwindcss',
      'bootstrap',
      'nodejs',
      'expressjs',
      'nestjs',
      'php',
      'laravel',
      'rubyonrails',
      'django',
      'springboot',
      'aspnet',
      'reactnative',
      'flutter',
      'swift',
      'kotlin',
      'javaandroid',
      'objectivec',
      'aws',
      'azure',
      'googlecloudplatform',
      'docker',
      'kubernetes',
      'cicd',
      'jenkins',
      'gitlabci',
      'mysql',
      'postgresql',
      'mongodb',
      'redis',
      'oracle',
      'sqlserver',
      'sqlite',
      'cybersecurity',
      'python',
      'tensorflow',
      'pytorch',
      'scikitlearn',
      'datascience',
      'machinelearning',
      'solidity',
      'web3js',
      'ethereum',
      'selenium',
      'junit',
      'tester',
      'mocha',
      'chai',
      'jest',
      'cypress',
    ],
    required: true,
  })
  skills: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updateAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;

  @Prop({ default: false })
  isVerify: boolean;

  @Prop({ type: String })
  tokenCheckVerify: string;

  @Prop()
  resetPasswordToken: string;

  @Prop({ default: '' })
  isPremium: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
