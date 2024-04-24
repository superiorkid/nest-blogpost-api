import { Body, Controller, Param, Patch, ValidationPipe } from '@nestjs/common';
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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  @Patch(':id/profile')
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
  async updateProfile(
    @Body(new ValidationPipe()) updateProfileDto: UpdateProfileDto,
    @Param('id') id: string,
  ) {
    return this.usersService.updateProfile({
      data: updateProfileDto,
      userId: id,
    });
  }
}
