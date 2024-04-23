import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { Public } from './decorators/public.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
@ApiTags('Authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  /**
   * Registers a new user.
   * @param signUpDto - Object containing user details for registration.
   * @returns An object with user details upon successful registration.
   */
  @Public()
  @Post('sign-up')
  @ApiCreatedResponse({
    description: 'Successfully registered user',
  })
  @ApiConflictResponse({ description: 'User already exist' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async signUp(@Body(new ValidationPipe()) signUpDto: SignUpDto) {
    return this.authenticationService.register(signUpDto);
  }

  /**
   * Logs in a user using email and password.
   * @param signInDto - Object containing email and password for login.
   * @returns An object with access token upon successful login.
   */
  @Public()
  @Post('sign-in')
  @ApiUnauthorizedResponse({
    description: 'Unauthorized: Invalid credentials or authentication token.',
  })
  @ApiCreatedResponse({ description: 'Successfully logged in.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authenticationService.login(signInDto);
  }
}
