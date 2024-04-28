import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isArray } from 'class-validator';
import * as fs from 'fs';
import { MemoryStoredFile } from 'nestjs-form-data';
import * as slug from 'slug';
import { DatabasesService } from 'src/databases/databases.service';
import { promisify } from 'util';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  private uploadPath: string;
  constructor(private prisma: DatabasesService) {
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
   * Create a new post.
   * @param params - Parameters including the post data and user ID.
   * @throws ConflictException if a post with the same title already exists.
   * @throws InternalServerErrorException if an internal server error occurs.
   */
  async create(params: { createPostDto: CreatePostDto; userId: string }) {
    try {
      const { createPostDto, userId } = params;
      const { title, body, summary } = createPostDto;

      // Generate slug for the post title
      const postSlug = slug(title);
      // Check if a post with the same slug already exists
      const post = await this.findOne({ slug: postSlug });

      // If a post with the same slug exists, throw a ConflictException
      if (post) throw new ConflictException('post already exist');

      // Convert tags string to an array
      const tags = this.convertToArray(createPostDto.tags, ',');

      // Create directory for storing uploaded files if it doesn't exist
      await this.createDirectoryIfNoExists(this.uploadPath);
      // Upload cover image and get its path
      const cover = await this.uploadFile(
        createPostDto.cover,
        this.uploadPath,
        postSlug,
      );

      // Create the post in the database
      const newPost = await this.prisma.post.create({
        data: {
          body,
          cover,
          title: title.toLowerCase(),
          slug: postSlug,
          summary: summary.toLowerCase(),
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
   * Upload a file and return its path.
   * @param file - File to upload.
   * @param destination - Destination directory for the uploaded file.
   * @param slug - Slug to use in the file name.
   * @returns The relative file path.
   */
  async uploadFile(file: MemoryStoredFile, destination: string, slug: string) {
    const { originalName, buffer } = file;

    // Generate file path
    const spliteedFileName = originalName.split('.');
    const splittedFileNameLength = spliteedFileName.length;
    const filePath =
      destination + `/${slug}.${spliteedFileName[splittedFileNameLength - 1]}`;

    // Write file to disk
    await promisify(fs.writeFile)(filePath, buffer);
    // Return relative file path
    return filePath.split('public')[1];
  }

  /**
   * Create a directory if it doesn't exist.
   * @param directoryPath - Path of the directory to create.
   */
  async createDirectoryIfNoExists(directoryPath: string) {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }
  }
}
