import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Headers, UnauthorizedException, ForbiddenException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DealsService } from './deals.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CreateDealDto } from './dto/create-deal.dto';
import { CreateAddonDealDto } from './dto/create-addon-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { createHmac, timingSafeEqual } from 'crypto';
import { UsersService } from '../users/users.service';

@Controller('deals')
export class DealsController {
  private readonly logger = new Logger(DealsController.name);
  private static readonly ADDON_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

  constructor(
    private readonly dealsService: DealsService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  // ==========================================
  // 🟢 NAYA RASTA: SIRF GMAIL ADD-ON KE LIYE (WITH API KEY)
  // ==========================================
  @Post('addon')
  @UseGuards(AuthGuard('jwt')) 
    async createFromAddon(
      @Request() req: any, // 👈 Inject the request to get the JWT user
      @Headers('x-api-key') apiKey: string,
      @Headers('x-addon-timestamp') addonTimestamp: string,
      @Headers('x-addon-signature') addonSignature: string,
      @Body() body: CreateAddonDealDto,
    ) {
      // ... [Keep your secret and timestamp validation logic exactly as is] ...

      // Validate timestamp
      const timestampMs = parseInt(addonTimestamp, 10);
      const now = Date.now();
      if (Math.abs(now - timestampMs) > DealsController.ADDON_TIMESTAMP_TOLERANCE_MS) {
        throw new BadRequestException('Request timestamp expired or invalid');
      }

      // 1. UPDATE CANONICAL PAYLOAD: Must exactly match Apps Script JSON.stringify
      const canonicalPayload = JSON.stringify({
        subject: body.subject || '',
        body: body.body || '',
        sender: body.sender || '',
        // userEmail removed!
        timestamp: String(timestampMs), 
      });

      const normalizedSignature = addonSignature?.trim() || '';
      const received = Buffer.from(normalizedSignature, 'utf8');

      const acceptedSecrets = [this.configService.get<string>('GMAIL_ADDON_SECRET')].filter(Boolean);
      if (acceptedSecrets.length === 0) {
        throw new InternalServerErrorException('GMAIL_ADDON_SECRET is not configured');
      }

      const signatureValid = acceptedSecrets.some((secret) => {
        if (!secret) return false;
        const expectedSignature = createHmac('sha256', secret)
          .update(canonicalPayload)
          .digest('base64');
        const expected = Buffer.from(expectedSignature, 'utf8');
        return received.length === expected.length && timingSafeEqual(received, expected);
      });

      if (!signatureValid) {
        this.logger.warn('Invalid addon signature provided to /deals/addon');
        throw new UnauthorizedException('Invalid request signature');
      }
      
      // 2. Extract email from JWT instead of Body
      const userEmail = req.user?.email; // 👈 Adjust this based on your JWT payload structure
      
      if (!userEmail) {
        throw new UnauthorizedException('User email could not be extracted from token!');
      }
      
      const isRegistered = await this.usersService.ensureRegistered(userEmail);
      if (!isRegistered) {
        throw new ForbiddenException('First sign up on web app');
      }

      // 3. Pass the extracted email to your service
      return this.dealsService.create(body, userEmail);
    }

  // ==========================================
  // 🔒 PURANAY RASTAY: WEB APP KE LIYE (JWT PROTECTED)
  // ==========================================
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createDealDto: CreateDealDto, @Request() req: any) {
    const userEmail = req.user.email; 
    return this.dealsService.create(createDealDto, userEmail);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req: any) {
    const userEmail = req.user.email;
    return this.dealsService.findAll(userEmail); 
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: UpdateDealDto, @Request() req: any) {
    // Verify user owns this deal before updating
    const deal = await this.dealsService.findById(+id);
    if (!deal || deal.user_email !== req.user.email) {
      throw new ForbiddenException('You do not own this deal');
    }
    return this.dealsService.update(+id, updateData, req.user.email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    // Verify user owns this deal before deleting
    const deal = await this.dealsService.findById(+id);
    if (!deal || deal.user_email !== req.user.email) {
      throw new ForbiddenException('You do not own this deal');
    }
    return this.dealsService.remove(+id, req.user.email);
  }
}