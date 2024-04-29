import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Match } from '../decorators/match.decorator';
import { Transform } from 'class-transformer';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Enter your first name',
    example: 'Wina',
    type: String,
  })
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  firstName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Enter your last name',
    example: 'Safitri',
  })
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Enter your email address',
    default: 'wina_safitri@email.com',
    type: String,
  })
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 25)
  @ApiProperty({
    example: '',
    description: 'Enter your password (6-25 characters)',
    type: String,
  })
  password: string;

  @Match(SignUpDto, (object) => object.password, {
    message: 'Passwords do not match',
  })
  @ApiProperty({
    default: '',
    description: 'Repeat your password (must match the password)',
    type: String,
  })
  confirmPassword: string;
}
