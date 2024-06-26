import { Dialect } from "sequelize";

export interface Environments {
  DB_URL: string | undefined;
  PORT: number | undefined;
  ACCESS_TOKEN_SECRET: string;
  LONG_ACCESS_TOKEN_EXPIRY: string;
  ACCESS_TOKEN_EXPIRES: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MAIL_PORT: number;
  MAIL_HOST: string;
  FROM_EMAIL: string;
  TO_EMAIL: string;
  MAIL_SERVICE: string;
  MAIL_REDIRECT_URI: string;
  MAIL_REFRESH_TOKEN: string;
  BASE_URL: string;
  FE_URL: string;
  DB_NAME: string | undefined;
  DB_PASSWORD: string | undefined;
  DB_USER: string | undefined;
  DB_DIALECT: Dialect;
  DB_HOST: string | undefined;
  DB_PORT: number | undefined;
  SENDGRID_API_KEY: string;
  FORUM_API_KEY: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_PROFILE_FOLDER: string;
  AWS_BUCKET_NAME: string;
  AWS_COURSE_FOLDER: string;
}
