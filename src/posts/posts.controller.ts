import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Endpoint for creating a post.
   * @param req - The request object.
   * @param createPostDto - The DTO containing data for creating the post.
   * @returns A response indicating the success of the post creation.
   */
  @ApiTags('Posts')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Post created successfully' })
  @ApiConflictResponse({ description: 'Post already exists' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post()
  @FormDataRequest()
  async createPost(
    @Req() req,
    @Body(new ValidationPipe()) createPostDto: CreatePostDto,
  ) {
    return this.postsService.create({ createPostDto, userId: req.user.sub });
  }
}
