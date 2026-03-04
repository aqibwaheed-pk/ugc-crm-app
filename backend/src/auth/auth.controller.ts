import { Body, Controller, ForbiddenException, Post, Res, Get, UseGuards, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { GoogleVerifyService } from './google.service';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { JwtStrategy } from './jwt.strategy'; // Ensure you have this guard created

@Controller('auth')
export class AuthController {
  constructor(
    private readonly googleService: GoogleVerifyService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  @Post('signup')
  async signUp(@Body() body: SignUpDto) {
    const user = await this.usersService.createLocalUser(body.name, body.email, body.password);
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id || user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  @Post('signin')
  async signIn(@Body() body: SignInDto) {
    const user = await this.usersService.validateLocalCredentials(body.email, body.password);
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id || user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  @Post('google-login')
  async googleLogin(@Body() body: GoogleLoginDto) {
    const googleUser = await this.googleService.verify(body.token);

    if (!googleUser.email) {
      throw new ForbiddenException('Google account email not available');
    }

    const registeredUser = await this.usersService.findByEmail(googleUser.email);

    if (!registeredUser) {
      throw new ForbiddenException('First sign up on web app');
    }

    const accessToken = this.jwtService.sign({
      email: registeredUser.email,
      sub: registeredUser.id || registeredUser.email,
    });

    return {
      accessToken,
      user: {
        id: registeredUser.id,
        name: registeredUser.name || googleUser.name,
        email: registeredUser.email,
      },
    };
  }

  // =========================================================================
  // GMAIL ADD-ON ENDPOINTS
  // =========================================================================

  /**
   * 1. The Add-on Login Endpoint
   * Your frontend login form will POST to this endpoint when opened from the Gmail Add-on.
   */
  @Post('addon-login')
  async addonLogin(
    @Body() body: { email: string; password: string; redirect_uri: string; state: string },
    @Res() res: Response
  ) {
    // 1. Verify credentials using your existing UsersService
    // validateLocalCredentials already throws an UnauthorizedException if invalid, so no extra checks needed!
    const user = await this.usersService.validateLocalCredentials(body.email, body.password);

    // 2. Generate the API Token (JWT) just like your signin method
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id || user.email,
    });

    // 3. Redirect back to Google Apps Script
    // Google requires the state parameter to be returned exactly as it was sent
    const callbackUrl = `${body.redirect_uri}?token=${accessToken}&state=${body.state}`;
    
    // Return the URL so your frontend can execute: window.location.href = data.redirectUrl;
    return res.json({ redirectUrl: callbackUrl }); 
  }

  /**
   * 2. Authenticating API Requests from the Add-on
   * Every time the add-on fetches data, it calls endpoints like this one.
   */
  @UseGuards(JwtStrategy)
  @Get('addon-data')
  getAddonData(@Req() req) {
    // req.user contains the decoded JWT
    return {
      message: 'Successfully authenticated from Gmail Add-on!',
      user: req.user,
      billingStatus: 'Active' // You can link this to your DB later to check subscription status
    };
  }
}