// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

    async validateUser(email: string, pass: string): Promise<any> {
        // FIX: Changed from findOneByEmail to findByEmail
        const user = await this.usersService.findByEmail(email); 
        
        // NOTE: You don't actually need this custom validation anymore 
        // because your UsersService now has `validateLocalCredentials`!
        if (user && user.password_hash === pass) { // Also updated password to password_hash based on your schema
        const { password_hash, ...result } = user;
        return result;
        }
        return null;
    }

  async generateToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}