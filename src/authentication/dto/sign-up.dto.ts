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
    description: 'enter your first name',
    default: 'wina',
    type: String,
  })
  firstName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'enter your last name',
    default: 'safitri',
  })
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'enter your email address',
    default: 'wina_safitri@email.com',
    type: String,
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 25)
  @ApiProperty({
    default: '',
    description: 'enter your password',
    type: String,
  })
  password: string;

  @Match(SignUpDto, (object) => object.password)
  @ApiProperty({
    default: '',
    description: 'repeat your password',
    type: String,
  })
  confirmPassword: string;
}
