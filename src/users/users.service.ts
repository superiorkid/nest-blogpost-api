import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DatabasesService } from 'src/databases/databases.service';

@Injectable()
export class UsersService {
  constructor(private prisma: DatabasesService) {}

  async findOne(params: {
    where: Prisma.UserWhereInput;
    include?: Prisma.UserInclude;
  }) {
    const { where, include } = params;

    return this.prisma.user.findFirst({ where, include });
  }

  /**
   * Asynchronously validates a user based on their email address.
   * @param {string} email - The email address of the user to validate.
   * @returns {Object|null} - Returns the user object if found, or null if not found.
   */
  async validateUser(email: string) {
    // Find the user with the given email address using the usersService
    const user = await this.findOne({ where: { email } });
    // If no user is found, return null
    if (!user) return null;
    // If a user is found, return the user object
    return user;
  }

  /**
   * Creates a new user in the database with the provided user, profile, and account inputs.
   * If a password is provided, it hashes the password before storing it.
   * If authentication is via a third-party provider (e.g., Google), it skips password hashing and uses the provider details.
   * @param params Object containing user, profile, and optional account inputs.
   * @returns The newly created user object.
   */
  async createUser(params: {
    userInputs: Prisma.UserCreateInput;
    profileInputs: Prisma.ProfileCreateWithoutUserInput;
    accountInputs?: Prisma.AccountCreateWithoutUserInput;
  }) {
    // Initialize variables to hold provider details and hashed password.
    let providerType: string | undefined;
    let providerId: string | undefined;
    let hashedPassword: string | undefined;

    // Destructure input parameters.
    const { profileInputs, userInputs, accountInputs } = params;
    const { email, password, avatar } = userInputs;
    const { firstName, lastName } = profileInputs;

    // If password is provided, hash it using bcrypt.
    if (userInputs.password) {
      const salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(password, salt);
    } else {
      // If authentication is via a third-party provider, extract provider details.
      providerId = accountInputs.providerId;
      providerType = accountInputs.providerType;
    }

    // Create user and associated profile data in the database.
    const newUser = await this.prisma.user.create({
      data: {
        email,
        avatar,
        password: hashedPassword,
        profile: { create: { firstName, lastName } },
        accounts: {
          create: providerId ? { providerId, providerType } : undefined,
        },
      },
      // Include the associated profile and account data in the returned user object.
      include: { profile: true, accounts: !!providerId },
    });

    // Return the newly created user object.
    return newUser;
  }

  /**
   * Updates the profile of a user with the provided data.
   * Retrieves the user by ID, validates its existence, and updates the profile using Prisma.
   * @param params Object containing profile data to be updated and the ID of the user.
   * @returns An object containing a message indicating the success of the update,
   *          the updated user data, and the HTTP status code.
   * @throws NotFoundException if the user with the specified ID is not found.
   * @throws InternalServerErrorException if an error occurs while updating the profile.
   */
  async updateProfile(params: {
    data: Prisma.ProfileUpdateInput;
    userId: string;
  }) {
    try {
      // Destructure parameters.
      const { data, userId } = params;

      // Find the user by ID.
      const user = await this.findOne({ where: { id: userId } });
      // If user not found, throw NotFoundException.
      if (!user) throw new NotFoundException('user not found');

      // Update the user's profile using Prisma.
      const updateUserProfile = await this.prisma.profile.update({
        where: { userId },
        data,
      });
      // Omit 'id' from the updated user profile data.
      const { id, ...userData } = updateUserProfile;

      // Return a success message along with the updated user data and status code.
      return {
        message: `Update ${userData.firstName} profile successfully`,
        statusCode: HttpStatus.OK,
        data: userData,
      };
    } catch (error) {
      // Handle specific exceptions.
      if (error instanceof NotFoundException) {
        // If user not found, rethrow NotFoundException.
        throw error;
      } else {
        // Log other errors and throw InternalServerErrorException.
        console.log(error);
        throw new InternalServerErrorException('failed to update profile');
      }
    }
  }

  /**
   * Retrieves a user profile based on the provided criteria.
   * @param params An object containing criteria for querying user and profile.
   * @returns An object containing the retrieved user profile data.
   * @throws {NotFoundException} If the user is not found.
   * @throws {InternalServerErrorException} If an error occurs during the process.
   */
  async getUserProfile(params: {
    whereUser: Prisma.UserWhereInput;
    whereProfile: Prisma.ProfileWhereInput;
    includeProfile?: Prisma.ProfileInclude;
  }) {
    // Destructure parameters
    const { whereUser, whereProfile, includeProfile } = params;

    try {
      // Find a user based on the provided criteria
      const user = await this.findOne({ where: whereUser });
      // If user not found, throw NotFoundException
      if (!user) throw new NotFoundException('user not found');

      // Find a profile based on the provided criteria, including optional related data
      const profile = await this.prisma.profile.findFirst({
        where: whereProfile,
        include: includeProfile,
      });

      // Construct success response
      return {
        message: `Get ${profile.firstName} profile successfully`,
        statusCode: HttpStatus.OK,
        data: profile,
      };
    } catch (error) {
      // Check if the error is NotFoundException and rethrow it
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        // Log other errors
        console.log(error);
        // Throw internal server error for other types of errors
        throw new InternalServerErrorException(
          'failed to get user information',
        );
      }
    }
  }
}
