// jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SUPER_SECRET_KEY', // Use Environment Variables in production!
    });
  }

  async validate(payload: any) {
    // This payload is the decoded JWT. It will be injected into req.user
    return { userId: payload.sub, email: payload.email };
  }
}