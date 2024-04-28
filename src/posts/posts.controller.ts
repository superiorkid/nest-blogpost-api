import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
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

  /**
   * Endpoint for retrieving a post by its slug.
   * @param slug - The slug of the post to retrieve.
   * @returns A response containing the retrieved post.
   */
  @ApiTags('Posts')
  @ApiOkResponse({ description: 'Get post successfully' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':slug')
  async getPost(@Param('slug') slug: string) {
    try {
      // Retrieve the post from the service based on the provided slug
      const post = await this.postsService.findOne({ slug });
      // If the post is not found, throw a NotFoundExceptio
      if (!post) throw new NotFoundException('post not found');

      // Return a response indicating successful post retrieval
      return {
        message: 'Get post successfully',
        statusCode: HttpStatus.OK,
        data: post,
      };
    } catch (error) {
      // If the error is a NotFoundException, re-throw it
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        // Log the error and throw an InternalServerErrorException
        console.error(error);
        throw new InternalServerErrorException(
          'something went wrong. failed to get post.',
        );
      }
    }
  }
}
