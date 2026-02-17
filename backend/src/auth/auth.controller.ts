import { Controller, Post, Body } from '@nestjs/common';
import { GoogleVerifyService } from './google.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private googleService: GoogleVerifyService,
    private jwtService: JwtService
  ) {}

  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    // 1. Verify Google Token
    const user = await this.googleService.verify(token);

    // 2. TODO: Yahan check karein ke User DB mein hai ya nahi (Save kar lein)
    // filhal hum seedha token de rahe hain.

    // 3. Issue App Token (JWT)
    const accessToken = this.jwtService.sign({ 
      email: user.email, 
      sub: user.googleId 
    });

    return { accessToken, user };
  }
}