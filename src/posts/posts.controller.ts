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
  Query,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { Public } from 'src/authentication/decorators/public.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { FindAllQuery } from './dto/find-all-query.dto';
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
  async getAll(@Query() query: FindAllQuery) {
    const { sortBy, skip, take, q } = query;
    const [field, sort] = sortBy ? sortBy.split('-') : ['date', 'desc'];

    return this.postsService.getPosts({
      where: {
        title: {
          contains: q,
        },
      },
      take: take ?? undefined,
      skip: skip ?? undefined,
      orderBy:
        field === 'title'
          ? {
              title: sort === 'desc' ? 'desc' : 'asc',
            }
          : field === 'date'
            ? { createdAt: sort === 'desc' ? 'desc' : 'asc' }
            : { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves posts from users followed by the authenticated user.
   * @param req - The request object containing the authenticated user's information.
   * @returns A response containing the posts from users followed by the authenticated user.
   */
  @ApiTags('Posts')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Get following post successfully' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get('following')
  async followingPosts(@Req() req) {
    // Retrieve posts from users followed by the authenticated user
    return this.postsService.getFollowingPosts({
      where: {
        author: {
          followers: {
            some: {
              followerId: req.user.sub,
            },
          },
        },
      },
      include: {
        author: true, // include author information
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            bookmarks: true,
          },
        },
      },
    });
  }

  /**
   * Adds a post to the user's bookmarks.
   * @param id - The ID of the post to be bookmarked.
   * @param req - The request object containing the authenticated user's information.
   * @returns A response indicating that the post has been successfully bookmarked.
   */
  @ApiTags('Bookmark')
  @ApiBearerAuth()
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiCreatedResponse({ description: 'Added post to bookmark successfully' })
  @ApiConflictResponse({ description: 'Post already on bookmark' })
  @Post(':id/bookmark')
  async addBookmark(@Param('id') id: string, @Req() req) {
    return this.postsService.addPostToBookmark({
      where: { AND: [{ postId: id }, { userId: req.user.sub }] },
      data: {
        post: {
          connect: {
            id,
          },
        },
        user: {
          connect: {
            id: req.user.sub,
          },
        },
      },
    });
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
