import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { SortEnum } from '../enums/post-sort.enum';

export class FindAllQuery {
  @ApiProperty({
    description: 'Search posts by title. This parameter is optional.',
    required: false,
  })
  @IsString()
  @IsOptional()
  q: string;

  @ApiProperty({
    enum: SortEnum,
    required: false,
    description:
      'Specify the sorting order for the results. Options include "title-desc" (descending by title), "title-asc" (ascending by title), "date-desc" (descending by date), and "date-asc" (ascending by date).',
  })
  @IsOptional()
  @IsEnum(SortEnum)
  sortBy: SortEnum;

  @ApiProperty({
    required: false,
    description:
      'Limit the number of results returned. Must be a positive integer.',
  })
  @IsNumberString()
  @IsPositive()
  @IsOptional()
  take: number;

  @ApiProperty({
    required: false,
    description:
      'Skip a certain number of results from the beginning. Must be a positive integer.',
  })
  @IsNumberString()
  @IsPositive()
  @IsOptional()
  skip: number;
}
