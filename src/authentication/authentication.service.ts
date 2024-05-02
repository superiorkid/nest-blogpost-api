import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { DatabasesService } from 'src/databases/databases.service';
import { UsersService } from 'src/users/users.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private prisma: DatabasesService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registers a new user.
   * @param signUpDto - Object containing user details for registration.
   * @returns An object with user details upon successful registration.
   * @throws ConflictException if a user with the provided email already exists.
   * @throws InternalServerErrorException if an error occurs during the registration process.
   */
  async register(signUpDto: SignUpDto) {
    try {
      const { email, firstName, lastName, password } = signUpDto;

      // check if user already exists
      const user = await this.usersService.validateUser(email);
      // if exists throw conflict exception
      if (user) throw new ConflictException('user already exist');

      const newUser = await this.usersService.createUser({
        userInputs: { email, password },
        profileInputs: { firstName, lastName },
      });

      return {
        message: 'Create user successfully',
        statusCode: HttpStatus.CREATED,
        data: newUser,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        // Re-throw ConflictException
        throw error;
      } else {
        // Log error and throw InternalServerErrorException for other errors
        console.error('failed to create user', error);
        throw new InternalServerErrorException('failed to create user');
      }
    }
  }

  /**
   * Authenticates a user by email and password.
   * @param signInDto - Object containing email and password for sign-in.
   * @returns An object with accessToken upon successful authentication.
   * @throws UnauthorizedException if the user is not found or the password doesn't match.
   * @throws InternalServerErrorException if an error occurs during the sign-in process.
   */
  async login(signInDto: SignInDto) {
    try {
      // Find the user by email
      const user = await this.usersService.validateUser(signInDto.email);
      // If user not found, throw UnauthorizedException
      if (!user || !user.password)
        throw new UnauthorizedException('Invalid credentials');

      // Compare password
      const passwordMatch = await bcrypt.compare(
        signInDto.password,
        user.password,
      );
      // If password don't match,throw UnauthorizedException
      if (!passwordMatch)
        throw new UnauthorizedException('Invalid credentials');

      // Generate JWT token payload
      const payload = { sub: user.id, email: user.email };
      // Sign JWT token
      const accessToken = await this.jwtService.signAsync(payload);

      // Return accessToken upon successful authentication
      return {
        accessToken,
        message: 'Login successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Check if the error is an instance of UnauthorizedException
      if (error instanceof UnauthorizedException) {
        // Re-throw UnauthorizedException
        throw error;
      } else {
        // Log error and throw InternalServerErrorException
        console.log('Failed to login', error);
        throw new InternalServerErrorException('Failed to login');
      }
    }
  }

  /**
   * Handles the callback from Google OAuth authentication.
   * Retrieves the user information from the request object.
   * @param req The HTTP request object containing the user information.
   * @returns A message indicating the status of the Google OAuth authentication and the user information if available.
   */
  async googleLogin(req: Request) {
    // Check if user information is available in the request object.
    if (!req.user) {
      return 'No user from google';
    }

    // If user information is available, return a message along with the user details.
    return {
      message: 'User information from google',
      user: req.user,
    };
  }
}
