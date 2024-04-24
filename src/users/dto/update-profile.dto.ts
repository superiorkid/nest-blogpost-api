import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsMobilePhone,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Your first name.',
    default: 'wina',
    type: String,
  })
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty({
    description: 'Your last name.',
    default: 'safitri',
    type: String,
  })
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty({
    description: 'Your phone number.',
    default: '+6287851451208',
    type: String,
  })
  @IsOptional()
  @IsMobilePhone()
  mobileNumber: string;

  @ApiProperty({
    enum: Gender,
    description: 'Your gender. Choose from MALE or FEMALE.',
    type: String,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender: Gender;

  @ApiProperty({ description: 'Your date of birth in YYYY-MM-DD format.' })
  @IsDateString()
  @IsOptional()
  birthOfDate: Date;
}
