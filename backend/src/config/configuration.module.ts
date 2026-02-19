import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, any>) => {
        const required = [
          'JWT_SECRET',
          'GOOGLE_CLIENT_ID',
          'SUPABASE_URL',
          'SUPABASE_KEY',
          'GEMINI_API_KEY',
          'ADDON_SECRET_KEY',
        ];

        const missing = required.filter((key) => !config[key]);

        if (missing.length > 0) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(
              `Missing required environment variables: ${missing.join(', ')}`,
            );
          } else {
           // In development, warn but allow to continue
            console.warn(
              `⚠️  Missing environment variables: ${missing.join(', ')}`,
            );
          }
        }

        // Validate JWT_SECRET length
        if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
          console.warn(
            '⚠️  JWT_SECRET should be at least 32 characters long for security',
          );
        }

        return config;
      },
    }),
  ],
})
export class ConfigurationModule {}
