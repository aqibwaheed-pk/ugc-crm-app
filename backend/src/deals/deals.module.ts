import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { AuthModule } from '../auth/auth.module'; // 👈 YEH LINE ADD KAREIN 

@Module({
  imports: [AuthModule], // 👈 YEH LINE ADD KAREIN
  controllers: [DealsController],
  providers: [DealsService],
})
export class DealsModule {}
