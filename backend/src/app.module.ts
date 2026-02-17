import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DealsModule } from './deals/deals.module';
import { AuthModule } from './auth/auth.module'; // <-- Add this

@Module({
  imports: [ConfigModule.forRoot(
    {
      isGlobal: true,
    }
  ), DealsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
