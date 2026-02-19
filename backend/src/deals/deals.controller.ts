import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Headers, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  // ==========================================
  // 🟢 NAYA RASTA: SIRF GMAIL ADD-ON KE LIYE (WITH API KEY)
  // ==========================================
  @Post('addon')
  async createFromAddon(@Headers('x-api-key') apiKey: string, @Body() body: CreateDealDto) {
    // 1. Secret Password Check karein
    if (apiKey !== process.env.ADDON_SECRET_KEY) {
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