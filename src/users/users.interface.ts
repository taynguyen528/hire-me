export interface IUser {
  _id: string;
  name: string;
  email: string;
  address: string;
  gender: string;
  avatar: string;
  phone: string;
  dateOfBirth: string;
  isVerify: string;
  isPremium: string;
  role: {
    _id: string;
    name: string;
  };
  permissions?: {
    _id: string;
    name: string;
    apiPath: string;
    module: string;
  }[];
}

export interface Permission {
  _id: string;
  name: string;
  apiPath: string;
  module: string;
}
