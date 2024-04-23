import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { DatabasesModule } from './databases/databases.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabasesModule,
    AuthenticationModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
