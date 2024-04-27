import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Enter your first name',
    example: 'Wina',
    type: String,
  })
  firstName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Enter your last name',
    example: 'Safitri',
  })
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Enter your email address',
    default: 'wina_safitri@email.com',
    type: String,
  })
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
