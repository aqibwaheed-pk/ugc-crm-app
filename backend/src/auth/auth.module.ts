import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { GoogleVerifyService } from './google.service';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'YOUR_SECRET_KEY_HERE', // Production main .env use karein!
      signOptions: { expiresIn: '7d' }, // 7 din tak login rahega
    }),
  ],
  controllers: [AuthController],
  providers: [GoogleVerifyService, JwtStrategy],
  exports: [JwtModule], // Taake dusre modules (Deals) check kar sakein
})
export class AuthModule {}