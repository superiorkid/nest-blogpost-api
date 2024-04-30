import { Module } from '@nestjs/common';
import { PostsService } from './services/posts.service';
import { PostsController } from './posts.controller';
import { DatabasesModule } from 'src/databases/databases.module';
import { StorageService } from './services/storage.service';

@Module({
  imports: [DatabasesModule],
  controllers: [PostsController],
  providers: [PostsService, StorageService],
  exports: [PostsService],
})
export class PostsModule {}
