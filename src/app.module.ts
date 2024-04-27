import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { DatabasesModule } from './databases/databases.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostsModule } from './posts/posts.module';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
