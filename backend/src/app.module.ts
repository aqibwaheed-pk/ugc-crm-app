import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DealsModule } from './deals/deals.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ConfigModule.forRoot(
    {
      isGlobal: true,
    }
  ), DatabaseModule, DealsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
