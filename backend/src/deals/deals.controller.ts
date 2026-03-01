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
  async createFromAddon(
    @Headers('x-api-key') apiKey: string,
    @Headers('x-addon-timestamp') addonTimestamp: string,
    @Headers('x-addon-signature') addonSignature: string,
    @Body() body: CreateAddonDealDto,
  ) {
    const configuredAddonSecret = this.configService.get<string>('ADDON_SECRET_KEY');
    const configuredPreviousAddonSecret = this.configService.get<string>('ADDON_SECRET_KEY_PREVIOUS');
    const normalizedApiKey = (apiKey || '').trim();
    const normalizedSecret = (configuredAddonSecret || '').trim();
    const normalizedPreviousSecret = (configuredPreviousAddonSecret || '').trim();
    const acceptedSecrets = [normalizedSecret, normalizedPreviousSecret].filter(Boolean);

    if (!normalizedSecret) {
      this.logger.error('ADDON_SECRET_KEY is not configured');
      throw new InternalServerErrorException('Add-on secret is not configured');
    }

    if (!normalizedApiKey) {
      this.logger.warn('Missing x-api-key header in /deals/addon request');
      throw new UnauthorizedException('Missing Add-on API key');
    }

    const matchedApiSecret = acceptedSecrets.find((secret) => secret === normalizedApiKey);

    // 1. Secret Password Check karein
    if (!matchedApiSecret) {
      this.logger.warn('Invalid x-api-key provided to /deals/addon');
      throw new UnauthorizedException('Invalid Add-on Password!');
    }

    const normalizedTimestamp = (addonTimestamp || '').trim();
    const normalizedSignature = (addonSignature || '').trim();

    if (!normalizedTimestamp || !normalizedSignature) {
      this.logger.warn('Missing signed headers in /deals/addon request');
      throw new UnauthorizedException('Missing signed request headers');
    }

    const timestampMs = Number(normalizedTimestamp);
    if (!Number.isFinite(timestampMs)) {
      this.logger.warn('Invalid x-addon-timestamp format in /deals/addon request');
      throw new UnauthorizedException('Invalid request timestamp');
    }

    const now = Date.now();
    if (Math.abs(now - timestampMs) > DealsController.ADDON_TIMESTAMP_TOLERANCE_MS) {
      this.logger.warn('Stale addon request blocked by timestamp window');
      throw new UnauthorizedException('Request expired');
    }

    const canonicalPayload = JSON.stringify({
      subject: body.subject || '',
      body: body.body || '',
      sender: body.sender || '',
      userEmail: body.userEmail || '',
      timestamp: normalizedTimestamp,
    });

    const received = Buffer.from(normalizedSignature, 'utf8');

    const signatureValid = acceptedSecrets.some((secret) => {
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
    
    // 2. Check karein ke Add-on ne email bheji hai ya nahi
    if (!body.userEmail) {
      throw new BadRequestException('User email is missing!');
    }
    
    const isRegistered = await this.usersService.ensureRegistered(body.userEmail);
    if (!isRegistered) {
      throw new ForbiddenException('First sign up on web app');
    }

    // 3. Data save karein
    return this.dealsService.create(body, body.userEmail);
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