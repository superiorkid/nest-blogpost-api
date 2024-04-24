import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for handling Google OAuth 2.0 authentication.
 * It extends the AuthGuard provided by Passport to handle Google OAuth authentication.
 */
@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  /**
   * Initializes the Google OAuth guard with configuration options.
   * @param configService The configuration service to retrieve environment variables.
   */
  constructor(private configService: ConfigService) {
    // Call the parent constructor to initialize the AuthGuard with Google OAuth strategy.
    super({
      // Configure access type for Google OAuth (offline access can be requested).
      accessType: 'offline',
    });
  }
}
