import * as dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const SECRET_KEY = required('JWT_SECRET');
export const ALGORITHM = 'HS256';
export const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(optional('JWT_ACCESS_EXPIRES_MIN', '15'));
export const REFRESH_TOKEN_EXPIRE_DAYS = parseInt(optional('JWT_REFRESH_EXPIRES_DAYS', '7'));

export const MINIO_ENDPOINT = required('MINIO_ENDPOINT');
export const MINIO_PUBLIC_URL = required('MINIO_PUBLIC_URL');
export const MINIO_ACCESS_KEY = required('MINIO_ACCESS_KEY');
export const MINIO_SECRET_KEY = required('MINIO_SECRET_KEY');
export const MINIO_BUCKET = optional('MINIO_BUCKET', 'nexus-generations');

export const STRIPE_SECRET_KEY = required('STRIPE_SECRET_KEY');
export const STRIPE_WEBHOOK_SECRET = optional('STRIPE_WEBHOOK_SECRET', '');

export const FRONTEND_URL = required('FRONTEND_URL');

export const GROQ_API_KEY = required('GROQ_API_KEY');

export const DATABASE_URL = required('DATABASE_URL');

export const CORS_ORIGINS = optional('CORS_ORIGINS', 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

export const SMTP_HOST = optional('SMTP_HOST', 'smtp.gmail.com');
export const SMTP_PORT = parseInt(optional('SMTP_PORT', '587'));
export const SMTP_USER = optional('SMTP_USER', '');
export const SMTP_PASS = optional('SMTP_PASS', '');
export const SMTP_FROM = optional('SMTP_FROM', 'Nexus AI <noreply@nexus.app>');
