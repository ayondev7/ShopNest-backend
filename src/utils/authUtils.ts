import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function hashPassword(password: string, rounds: number = 12): Promise<string> {
  return await bcrypt.hash(password, rounds);
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export function generateToken(payload: object, expiresIn: string = '3h'): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    return null;
  }
}

export function sanitizeUserData(user: any, fieldsToRemove: string[] = ['password']): any {
  const sanitized = { ...user };
  fieldsToRemove.forEach(field => delete sanitized[field]);
  return sanitized;
}
