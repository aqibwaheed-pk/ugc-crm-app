import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleVerifyService {
  private client: OAuth2Client;

  constructor() {
    // Make sure .env mein GOOGLE_CLIENT_ID ho
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verify(token: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      // ✅ FIX: Check agar payload undefined hai
      if (!payload) {
        throw new UnauthorizedException('Google Token is valid but payload is empty');
      }

      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        googleId: payload.sub,
      };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid Google Token');
    }
  }
}