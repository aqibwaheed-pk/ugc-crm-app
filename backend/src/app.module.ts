import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DealsModule } from './deals/deals.module';

@Module({
  imports: [ConfigModule.forRoot(
    {
      isGlobal: true,
    }
  ), DealsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
