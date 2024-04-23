import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabasesService } from 'src/databases/databases.service';

@Injectable()
export class UsersService {
  constructor(private prisma: DatabasesService) {}

  async findOne(where: Prisma.UserWhereInput) {
    return this.prisma.user.findFirst({ where });
  }
}
