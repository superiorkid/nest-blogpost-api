import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DatabasesService } from 'src/databases/databases.service';

@Injectable()
export class UsersService {
  constructor(private prisma: DatabasesService) {}

  async findOne(where: Prisma.UserWhereInput) {
    return this.prisma.user.findFirst({ where });
  }

  /**
   * Asynchronously validates a user based on their email address.
   * @param {string} email - The email address of the user to validate.
   * @returns {Object|null} - Returns the user object if found, or null if not found.
   */
  async validateUser(email: string) {
    // Find the user with the given email address using the usersService
    const user = await this.findOne({ email });
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
          create: { providerId, providerType },
        },
      },
      // Include the associated profile and account data in the returned user object.
      include: { profile: true, accounts: true },
    });

    // Return the newly created user object.
    return newUser;
  }
}
