import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleVerifyService } from './google.service';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

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
}
