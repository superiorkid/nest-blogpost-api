import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabasesModule } from 'src/databases/databases.module';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  imports: [DatabasesModule, PostsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
