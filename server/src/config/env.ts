import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: required('JWT_SECRET'),
  DATABASE_URL: required('DATABASE_URL'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  ARK_API_KEY: required('ARK_API_KEY'),
  ARK_MODEL: process.env.ARK_MODEL || 'doubao-seed-2-0-lite-260215',
};
