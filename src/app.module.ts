import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
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
    DatabasesModule,
    AuthenticationModule,
    UsersModule,
    PostsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
