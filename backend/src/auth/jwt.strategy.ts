import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: "sponso_secret_key_12345",
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email }; // Ye data ab 'req.user' mein available hoga
  }
}