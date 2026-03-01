import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { SupabaseService } from '../database/supabase.service';

const scrypt = promisify(scryptCallback);

type UserRecord = {
  id?: string;
  name?: string;
  email: string;
  password_hash?: string | null;
  auth_provider?: string | null;
  google_id?: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, hashHex] = (storedHash || '').split(':');
    if (!salt || !hashHex) {
      return false;
    }

    const derived = (await scrypt(password, salt, 64)) as Buffer;
    const stored = Buffer.from(hashHex, 'hex');

    if (derived.length !== stored.length) {
      return false;
    }

    return timingSafeEqual(derived, stored);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = this.normalizeEmail(email);

    const { data, error } = await this.supabaseService
      .from('users')
      .select('id, name, email, password_hash, auth_provider, google_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Failed to fetch user');
    }

    return data;
  }

  async ensureRegistered(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return Boolean(user);
  }

  async createLocalUser(name: string, email: string, password: string): Promise<UserRecord> {
    const normalizedEmail = this.normalizeEmail(email);
    const existing = await this.findByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(password);

    const { data, error } = await this.supabaseService
      .from('users')
      .insert([
        {
          name: (name || '').trim(),
          email: normalizedEmail,
          password_hash: passwordHash,
          auth_provider: 'local',
          created_at: new Date().toISOString(),
        },
      ])
      .select('id, name, email, auth_provider, google_id')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Failed to create user');
    }

    return data;
  }

  async validateLocalCredentials(email: string, password: string): Promise<UserRecord> {
    const user = await this.findByEmail(email);

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.verifyPassword(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }
}
