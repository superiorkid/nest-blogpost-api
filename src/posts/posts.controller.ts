import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import slug from 'slug';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  private uploadPath: string;
  constructor(private readonly postsService: PostsService) {
    this.uploadPath = './public/posts';
  }

  @ApiTags('Posts')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Post created successfully' })
  @ApiConflictResponse({ description: 'Post already exists' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post()
  @FormDataRequest()
  async createPost(@Body(new ValidationPipe()) createPostDto: CreatePostDto) {
    const { body, summary, title } = createPostDto;

    const postSlug = slug(title);
    const tags = this.postsService.convertToArray(createPostDto.tags, ',');

    await this.postsService.createDirectoryIfNoExists(this.uploadPath);
    const cover = await this.postsService.uploadFile(
      createPostDto.cover,
      this.uploadPath,
      postSlug,
    );

    return this.postsService.create({
      title,
      summary,
      body,
      cover,
      slug: postSlug,
      tags: {
        create: {
          tag: {
            connectOrCreate: tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
      },
    });
  }
}
