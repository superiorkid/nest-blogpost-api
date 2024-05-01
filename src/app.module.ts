import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { join } from 'path';
import { AuthenticationModule } from './authentication/authentication.module';
import { DatabasesModule } from './databases/databases.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // ServeStaticModule for serving static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Path to the public directory
      exclude: ['/api/(.*)'], // Exclude URLs matching the specified pattern from static file serving
    }),
    // ConfigModule for loading configuration, made global to be available across the app
    ConfigModule.forRoot({ isGlobal: true }),
    // NestjsFormDataModule for handling form data
    NestjsFormDataModule.config({ isGlobal: true }),
    // ThrottlerModule for handling rate limit
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: 3,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 20,
        },
        {
          name: 'long',
          ttl: 60000,
          limit: 50,
        },
      ],
    }),
    DatabasesModule,
    AuthenticationModule,
    UsersModule,
    PostsModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
