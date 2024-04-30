import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isArray } from 'class-validator';
import * as slug from 'slug';
import { DatabasesService } from 'src/databases/databases.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { StorageService } from './storage.service';

@Injectable()
export class PostsService {
  private uploadPath: string;
  constructor(
    private prisma: DatabasesService,
    private storageService: StorageService,
  ) {
    // Path where uploaded files will be stored
    this.uploadPath = './public/posts';
  }

  /**
   * Find a single post based on provided criteria.
   * @param where - Criteria to search for the post.
   * @returns A post matching the criteria, if found.
   */
  async findOne(where: Prisma.PostWhereInput) {
    return this.prisma.post.findFirst({ where });
  }

  /**
   * Retrieve multiple posts based on specified criteria.
   * @param params - Parameters including the number of posts to retrieve, number of posts to skip, query conditions, sorting order, and included relations.
   * @returns A promise resolving to an array of retrieved posts.
   */
  async findMany(params: {
    take?: number;
    skip?: number;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
    include?: Prisma.PostInclude;
  }) {
    const { include, orderBy, skip, take, where } = params;

    // Retrieve posts from the database based on provided parameters
    return this.prisma.post.findMany({
      where,
      take,
      skip,
      orderBy,
      include,
    });
  }

  /**
   * Create a new post.
   * @param params - Parameters including the post data and user ID.
   * @throws ConflictException if a post with the same title already exists.
   * @throws InternalServerErrorException if an internal server error occurs.
   */
  async create(params: { createPostDto: CreatePostDto; userId: string }) {
    try {
      const { createPostDto, userId } = params;
      const { title, body, tags, summary } = createPostDto;

      // Generate slug for the post title
      const postSlug = slug(title);
      // Check if a post with the same slug already exists
      const post = await this.findOne({ slug: postSlug });

      // If a post with the same slug exists, throw a ConflictException
      if (post) throw new ConflictException('post already exist');

      // Create directory for storing uploaded files if it doesn't exist
      await this.storageService.createDirectoryIfNoExists(this.uploadPath);
      // Upload cover image and get its path
      const cover = await this.storageService.uploadFile(
        createPostDto.cover,
        this.uploadPath,
        postSlug,
      );

      // Create the post in the database
      const newPost = await this.prisma.post.create({
        data: {
          body,
          cover,
          title,
          summary,
          slug: postSlug,
          author: {
            connect: {
              id: userId,
            },
          },
          tags: {
            create: tags.map((tag) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tag },
                  create: { name: tag },
                },
              },
            })),
          },
        },
      });

      return {
        message: 'Create new post successfully',
        statusCode: HttpStatus.CREATED,
        data: newPost,
      };
    } catch (error) {
      // If the error is a ConflictException, re-throw it
      if (error instanceof ConflictException) {
        throw error;
      } else {
        // Log the error and throw a InternalServerErrorException
        console.error(error);
        throw new InternalServerErrorException(
          'Failed to creat post. something went wrong',
        );
      }
    }
  }

  /**
   * Convert a string or string array to an array.
   * @param data - Data to convert.
   * @param splitter - Separator to split the string.
   * @returns An array containing the converted data.
   */
  convertToArray(data: string | string[], splitter: string) {
    if (isArray(data)) {
      return data;
    }

    const arrayData = data.split(splitter);
    return arrayData;
  }

  /**
   * Asynchronously removes a post based on the provided criteria.
   * @param {Prisma.PostWhereInput} where - Criteria to find the post to remove.
   * @returns {Promise<{ message: string, statusCode: number }>} - A message indicating the result of the deletion operation.
   * @throws {NotFoundException} - If the post matching the criteria is not found.
   * @throws {InternalServerErrorException} - If an unexpected error occurs during the deletion process.
   */
  async remove(where: Prisma.PostWhereInput) {
    try {
      // Find the post based on the provided criteria
      const post = await this.findOne(where);
      // If post is not found, throw NotFoundException
      if (!post) throw new NotFoundException('post not found');

      // Delete the post using Prisma
      const deletePost = await this.prisma.post.delete({
        where: {
          id: post.id,
        },
      });

      // Remove the associated cover file from storage
      this.storageService.removeFile('./public' + post.cover);

      // Return success message
      return {
        message: 'delete post successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // If NotFoundException, re-throw it
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        // Log unexpected errors and throw InternalServerErrorException
        console.error(error);
        throw new InternalServerErrorException(
          'something went wrong. failed to delete post.',
        );
      }
    }
  }

  /**
   * Update an existing post.
   * @param params - Parameters including the post data, user ID, and post slug.
   * @returns A response indicating the success of the post update.
   * @throws NotFoundException if the post is not found.
   * @throws InternalServerErrorException if an internal server error occurs.
   */
  async updatePost(params: {
    updatePostDto: UpdatePostDto;
    userId: string;
    slug: string;
  }) {
    const {
      updatePostDto: { body, title, cover, tags, summary },
    } = params;

    try {
      // Find the post to be updated
      const post = await this.findOne({
        AND: [{ slug: params.slug }, { authorId: params.userId }],
      });
      // Throw a NotFoundException if the post is not found
      if (!post) throw new NotFoundException('Post not found');

      // Generate slug for the updated post title
      const postSlug = title ? slug(title) : undefined;

      let postCover: string | undefined;
      // If cover image is provided, update it
      if (cover) {
        // Delete previous cover image
        const deletePreviousCover = this.storageService.removeFile(
          './public' + post.cover,
        );

        // Upload new cover image
        postCover = await this.storageService.uploadFile(
          cover,
          this.uploadPath,
          postSlug,
        );
      }

      // Update the post in the database
      const { id, ...restValue } = await this.prisma.post.update({
        where: {
          id: post.id,
        },
        data: {
          title,
          summary,
          body,
          cover: postCover,
          slug: postSlug,
          tags: tags
            ? {
                create: tags.map((tag) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name: tag },
                      create: { name: tag },
                    },
                  },
                })),
              }
            : undefined,
        },
      });

      // Return a response indicating successful post update
      return {
        message: 'Update post successfully',
        statusCode: HttpStatus.OK,
        data: restValue,
      };
    } catch (error) {
      // If the error is a NotFoundException, re-throw it
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        // Log the error and throw an InternalServerErrorException
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong. Failed to update post',
        );
      }
    }
  }

  /**
   * Retrieve multiple posts based on specified criteria.
   * @param params - Parameters including the number of posts to retrieve, number of posts to skip, query conditions, and sorting order.
   * @returns A response containing the retrieved posts.
   * @throws InternalServerErrorException if an internal server error occurs.
   */
  async getPosts(params: {
    take?: number;
    skip?: number;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
    include?: Prisma.PostInclude;
  }) {
    const { orderBy, skip, take, where, include } = params;

    try {
      // Retrieve posts from the database based on provided parameters
      const posts = await this.findMany({
        where,
        include,
        orderBy,
        skip,
        take,
      });

      // Return a response indicating successful post retrieval
      return {
        message: 'get posts successfully',
        statusCode: HttpStatus.OK,
        data: posts,
      };
    } catch (error) {
      // Log the error and throw an InternalServerErrorException
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to get posts. something went wrong',
      );
    }
  }
}
