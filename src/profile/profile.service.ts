import { Injectable } from '@nestjs/common';
import { type UUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly usersService: UsersService) {}

  getProfile(userId: UUID) {
    return this.usersService.findOne(userId);
  }

  async getAddresses(userId: UUID) {
    const profile = await this.usersService.findOne(userId);
    return (profile as { addresses?: unknown[] }).addresses || [];
  }

  updateProfile(userId: UUID, updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }
}
