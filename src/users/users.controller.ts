import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
import { Public } from 'src/authentication/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Delete a user profile by ID.
   * @param id The ID of the user whose profile is to be deleted.
   * @returns A message indicating the success of the deletion operation.
   */
  @ApiTags('Users')
  @ApiOkResponse({ description: 'Delete user successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The ID of the user whose profile is to be deleted.',
    type: String,
    required: true,
  })
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.removeUser({ id });
  }

  /**
   * Endpoint to retrieve posts of a specific user.
   * @param id The ID of the user.
   * @returns {Promise<any>} User posts along with associated tags.
   */
  @ApiTags('Users')
  @ApiOkResponse({ description: 'Get user posts successfully' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user.',
    type: String,
    required: true,
  })
  @Public()
  @Get(':id/posts')
  async getUserPost(@Param('id') id: string) {
    // Calling a service method to fetch user posts
    return this.usersService.getUserPost({
      userId: id,
      where: {
        authorId: id,
      },
      include: {
        tags: true,
      },
    });
  }

  /**
   * Updates the profile of a user identified by the provided ID.
   * Validates the request body against the UpdateProfileDto schema.
   * @param updateProfileDto The DTO containing the updated profile information.
   * @param id The ID of the user whose profile is to be updated.
   * @returns An object containing a message indicating the success of the update,
   *          the updated user data, and the HTTP status code.
   * @throws NotFoundException if the user with the specified ID is not found.
   * @throws InternalServerErrorException if an error occurs while updating the profile.
   */
  @ApiTags('Profile')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The ID of the user whose profile is to be updated.',
    type: String,
    required: true,
  })
  @ApiOkResponse({ description: 'Profile updated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Patch(':id/profile')
  async updateProfile(
    @Body(new ValidationPipe()) updateProfileDto: UpdateProfileDto,
    @Param('id') id: string,
  ) {
    return this.usersService.updateProfile({
      data: updateProfileDto,
      userId: id,
    });
  }

  /**
   * Retrieves the profile of a user identified by the provided ID.
   * @param id The ID of the user whose profile is to be retrieved.
   * @returns An object containing the retrieved user profile data.
   * @throws {NotFoundException} If the user is not found.
   * @throws {InternalServerErrorException} If an error occurs during the process.
   */
  @ApiTags('Profile')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'The ID of the user whose profile is to be updated.',
    type: String,
    required: true,
  })
  @ApiOkResponse({ description: 'Get profile successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    // Call the getUserProfile method of the usersService to retrieve the profile
    return this.usersService.getUserProfile({
      whereProfile: { userId: id },
      whereUser: { id: id },
      includeProfile: {
        user: true,
      },
    });
  }
}
