import bcrypt from 'bcryptjs';
import { bcryptRounds } from '../config.js';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, bcryptRounds);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
