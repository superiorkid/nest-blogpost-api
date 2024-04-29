import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { Public } from 'src/authentication/decorators/public.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './services/posts.service';

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
    @Body(new ValidationPipe({ transform: true })) createPostDto: CreatePostDto,
  ) {
    return this.postsService.create({ createPostDto, userId: req.user.sub });
  }

  @ApiTags('Posts')
  @ApiOkResponse({ description: 'Get posts successfully' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Public()
  @Get()
  async getAll() {
    return this.postsService.getPosts({});
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
  @Public()
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

  /**
   * Endpoint for deleting a post by its ID.
   * @param id - The ID of the post to delete.
   * @param req - The request object containing user information.
   * @returns A response indicating the success of the post deletion.
   */
  @ApiTags('Posts')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Delete post successfully' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Delete(':id')
  async deletePost(@Param('id') id: string, @Req() req) {
    return this.postsService.remove({
      AND: [{ id }, { authorId: req.user.sub }],
    });
  }

  @ApiTags('Posts')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Update post successfully' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBody({
    required: false,
    type: UpdatePostDto,
    description: 'Update post schema DTO',
  })
  @Patch(':slug')
  @FormDataRequest()
  async updatePost(
    @Req() req,
    @Param('slug') slug: string,
    @Body(new ValidationPipe({ transform: true })) updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost({
      updatePostDto,
      slug,
      userId: req.user.sub,
    });
  }
}
