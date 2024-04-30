import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
  isArray,
} from 'class-validator';
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the blog post',
    example: '10 Tips for Effective Time Management',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 70)
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  title: string;

  @ApiProperty({
    description: 'Summary of the blog post',
    example:
      "In today's fast-paced world, managing your time effectively is crucial for productivity and success...",
  })
  @IsString()
  @IsNotEmpty()
  @Length(50, 160)
  summary: string;

  @ApiProperty({
    description: 'Body/content of the blog post',
    example:
      '1. Set Clear Goals: Start by defining what you want to achieve and prioritize tasks accordingly...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  body: string;

  @ApiProperty({
    description: 'Tags associa  ted with the blog post',
    example: ['time management', 'productivity', 'organization'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  @Transform(({ value }) => {
    const tagsArray: string[] = isArray(value) ? value : Array(value);
    return tagsArray.map((tag) => tag.toLocaleLowerCase());
  })
  tags: string[];

  @ApiProperty({
    type: String,
    format: 'binary',
    description: 'Cover image for the blog post (JPEG, PNG, WEBP, AVIF)',
  })
  @IsFile()
  @MaxFileSize(2000000) // 2mb
  @HasMimeType([
    'image/avif',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ])
  cover: MemoryStoredFile;
}
