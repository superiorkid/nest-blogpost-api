import { Injectable } from '@nestjs/common';
import { DatabasesService } from 'src/databases/databases.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';
import { isArray } from 'class-validator';
import * as fs from 'fs';
import { MemoryStoredFile } from 'nestjs-form-data';
import { promisify } from 'util';

@Injectable()
export class PostsService {
  constructor(private prisma: DatabasesService) {}

  async create(data: Prisma.PostCreateInput) {
    console.log(data);
    return {
      message: 'create new post',
    };
  }

  convertToArray(data: string | string[], splitter: string) {
    if (isArray(data)) {
      return data;
    }

    const toArr = data.split(splitter);
    return toArr;
  }

  async uploadFile(file: MemoryStoredFile, destination: string, slug: string) {
    const { originalName, buffer } = file;

    const spliteedFileName = originalName.split('.');
    const splittedFileNameLength = spliteedFileName.length;
    const filePath =
      destination +
      `/${Date.now()}-${slug}.${spliteedFileName[splittedFileNameLength - 1]}`;

    await promisify(fs.writeFile)(filePath, buffer);
    return filePath.split('public')[1];
  }

  async createDirectoryIfNoExists(directoryPath: string) {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }
  }
}
