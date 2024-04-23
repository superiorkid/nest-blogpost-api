import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard to check the validity of JWT tokens in incoming requests.
 * It extracts the token from the Authorization header and verifies it using the JwtService.
 * If the token is valid, it attaches the payload to the request object.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  /**
   * Checks if the incoming request contains a valid JWT token and authorizes access.
   * If the token is valid, it attaches the payload to the request object.
   * @param context The execution context containing the request object.
   * @returns A boolean indicating whether the request is authorized.
   * @throws UnauthorizedException if the token is missing or invalid.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public, if yes, allow access without token.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Extract token from the request header.
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // If token is missing, throw unauthorized exception.
    if (!token) throw new UnauthorizedException('Invalid credentials');

    try {
      // Verify the token using JWT service.
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('SECRET_KEY'),
      });

      // Attaching the payload to the request object for further use.
      request['user'] = payload;
    } catch (error) {
      // If token verification fails, throw unauthorized exception.
      throw new UnauthorizedException('Invalid credentials');
    }

    // If token is valid, allow access.
    return true;
  }

  /**
   * Extracts the JWT token from the Authorization header of the request.
   * @param request The incoming HTTP request.
   * @returns The JWT token if present, otherwise undefined.
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
