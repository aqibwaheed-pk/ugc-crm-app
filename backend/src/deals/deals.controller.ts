import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Headers, UnauthorizedException, ForbiddenException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DealsService } from './deals.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CreateDealDto } from './dto/create-deal.dto';
import { CreateAddonDealDto } from './dto/create-addon-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Controller('deals')
export class DealsController {
  private readonly logger = new Logger(DealsController.name);

  constructor(
    private readonly dealsService: DealsService,
    private readonly configService: ConfigService,
  ) {}

  // ==========================================
  // 🟢 NAYA RASTA: SIRF GMAIL ADD-ON KE LIYE (WITH API KEY)
  // ==========================================
  @Post('addon')
  async createFromAddon(@Headers('x-api-key') apiKey: string, @Body() body: CreateAddonDealDto) {
    const configuredAddonSecret = this.configService.get<string>('ADDON_SECRET_KEY');
    const normalizedApiKey = (apiKey || '').trim();
    const normalizedSecret = (configuredAddonSecret || '').trim();

    if (!normalizedSecret) {
      this.logger.error('ADDON_SECRET_KEY is not configured');
      throw new InternalServerErrorException('Add-on secret is not configured');
    }

    if (!normalizedApiKey) {
      this.logger.warn('Missing x-api-key header in /deals/addon request');
      throw new UnauthorizedException('Missing Add-on API key');
    }

    // 1. Secret Password Check karein
    if (normalizedApiKey !== normalizedSecret) {
      this.logger.warn('Invalid x-api-key provided to /deals/addon');
      throw new UnauthorizedException('Invalid Add-on Password!');
    }
    
    // 2. Check karein ke Add-on ne email bheji hai ya nahi
    if (!body.userEmail) {
      throw new BadRequestException('User email is missing!');
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