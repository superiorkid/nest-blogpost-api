import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { DatabasesModule } from 'src/databases/databases.module';

@Module({
  imports: [DatabasesModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
