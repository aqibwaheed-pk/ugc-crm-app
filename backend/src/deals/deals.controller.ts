import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { AuthGuard } from '@nestjs/passport'; // <-- Add this

@Controller('deals')
@UseGuards(AuthGuard('jwt')) // 🚨 YEH LINE SB SE ZAROORI HAI (Poora Controller Lock)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

@Post()
  create(@Body() createDealDto: any) {
    console.log('Data received from Gmail:', createDealDto);
    return this.dealsService.create(createDealDto);
  }

  // @Get()
  // findAll() {
  //   return this.dealsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.dealsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto) {
  //   return this.dealsService.update(+id, updateDealDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.dealsService.remove(+id);
  // }
}
