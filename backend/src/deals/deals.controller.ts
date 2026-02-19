import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Headers, UnauthorizedException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  // ==========================================
  // 🟢 NAYA RASTA: SIRF GMAIL ADD-ON KE LIYE (WITH API KEY)
  // ==========================================
  @Post('addon')
  async createFromAddon(@Headers('x-api-key') apiKey: string, @Body() body: any) {
    // 1. Secret Password Check karein
    if (apiKey !== 'sponso_addon_secret_123') {
      throw new UnauthorizedException('Invalid Add-on Password!');
    }
    
    // 2. Check karein ke Add-on ne email bheji hai ya nahi
    if (!body.userEmail) {
      throw new UnauthorizedException('User email is missing!');
    }
    
    // 3. Data save karein
    return this.dealsService.create(body, body.userEmail);
  }

  // ==========================================
  // 🔒 PURANAY RASTAY: WEB APP KE LIYE (JWT PROTECTED)
  // ==========================================
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createDealDto: any, @Request() req: any) {
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
  update(@Param('id') id: string, @Body() updateData: any, @Request() req: any) {
    return this.dealsService.update(+id, updateData, req.user.email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.dealsService.remove(+id, req.user.email);
  }
}