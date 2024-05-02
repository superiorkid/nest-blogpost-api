import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';

/**
 * Strategy for handling authentication using Google OAuth 2.0.
 * It validates users using Google's OAuth authentication.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  // Call the parent constructor to initialize the Google OAuth 2.0 strategy.
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('CALLBACK_URL'),
      scope: ['profile', 'email'],
      prompt: 'select_account',
    });
  }

  /**
   * Validates the user profile retrieved from Google OAuth.
   * If the user does not exist, creates a new user in the system.
   * Generates and returns a JWT access token for the authenticated user.
   * @param profile The user's profile retrieved from Google OAuth.
   * @param _accessToken The access token provided by Google (not used).
   * @param _refreshToken The refresh token provided by Google (not used).
   * @param done Callback function to indicate the completion of the authentication process.
   */
  async validate(
    profile: Profile,
    _accessToken: string,
    _refreshToken: string,
    done: VerifyCallback,
  ) {
    // Initialize payload data for JWT token.
    let payloadData: { id: string; email: string };

    // Extract relevant data from the Google profile.
    const { id, displayName, emails, photos } = profile;
    const email = emails.at(0).value;
    const avatar = photos.at(0).value;

    // Split display name into first name and last name.
    const splittedName = displayName.split(' ');
    const firstName = splittedName.at(0);
    const lastName = splittedName.at(1) ?? undefined;

    // Check if the user exists in the database.
    const user = await this.usersService.validateUser(email);
    // If user does not exist, create a new user in the system.
    if (!user) {
      const newUser = await this.usersService.createUser({
        userInputs: { email, avatar },
        profileInputs: { firstName, lastName },
        accountInputs: { providerId: id, providerType: 'google' },
      });

      // Assign new user's data to payload.
      payloadData.id = newUser.id;
      payloadData.email = newUser.email;
    }
    // If user already exists, use existing user's data.
    else {
      payloadData.id = user.id;
      payloadData.email = user.email;
    }

    // Create payload for JWT token.
    const payload = { sub: payloadData.id, email: payloadData.email };
    // Generate JWT access token.
    const accessToken = await this.jwtService.signAsync(payload);

    // Prepare data to be sent back to the authentication process.
    const userData = {
      accessToken,
      message: 'successfully logged-in using google',
      statusCode: HttpStatus.OK,
    };

    // Call the done callback to indicate successful authentication.
    done(null, profile);
  }
}
