import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { GoogleVerifyService } from './google.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: "sponso_secret_key_12345", // ✅ ENV se read karega
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [GoogleVerifyService, JwtStrategy],
  exports: [JwtModule, PassportModule,GoogleVerifyService],
})
export class AuthModule {}