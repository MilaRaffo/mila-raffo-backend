import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { type UUID } from 'crypto';
import { RoleName } from '../roles/entities/role.entity';
import { UserListItemDto } from './dto/user-list-item.dto';
import { UserDetailDto } from './dto/user-detail.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDetailDto> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    const createdUser = await this.findOneEntity(savedUser.id);

    if (!createdUser) {
      throw new BadRequestException('User created but could not be loaded');
    }

    return UserDetailDto.fromEntity(createdUser);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<UserListItemDto>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [users, total] = await this.usersRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users.map(UserListItemDto.fromEntity),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<UserDetailDto> {
    const user = await this.findOneEntity(id);
    return UserDetailDto.fromEntity(user);
  }

  async getUserById(id: UUID): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  private async findOneEntity(id: UUID): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email })
      .getOne();
  }

  async getProfile(id: UUID): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateProfile(
    id: UUID,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserDetailDto> {
    const user = await this.getUserById(id);

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateProfileDto);
    await this.usersRepository.save(user);

    const updatedUser = await this.findOneEntity(id);
    return UserDetailDto.fromEntity(updatedUser);
  }

  async update(
    id: UUID,
    updateUserDto: UpdateUserDto,
    currentUserRole?: RoleName,
  ): Promise<UserDetailDto> {
    const user = await this.findOneEntity(id);

    if (currentUserRole === RoleName.ADMIN) {
      if (
        user.role.name === RoleName.ADMIN ||
        user.role.name === RoleName.SUPERADMIN
      ) {
        throw new ForbiddenException(
          'Admins cannot modify other admins or superadmins',
        );
      }

      if (updateUserDto.roleId) {
        throw new ForbiddenException('Admins cannot change user roles');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    await this.usersRepository.save(user);
    const updatedUser = await this.findOneEntity(id);
    return UserDetailDto.fromEntity(updatedUser);
  }

  async updatePassword(id: UUID, newPassword: string): Promise<void> {
    const user = await this.findOneEntity(id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);
  }

  async remove(id: UUID, currentUserRole?: RoleName): Promise<void> {
    const user = await this.findOneEntity(id);

    if (currentUserRole === RoleName.ADMIN) {
      if (
        user.role.name === RoleName.ADMIN ||
        user.role.name === RoleName.SUPERADMIN
      ) {
        throw new ForbiddenException(
          'Admins cannot delete other admins or superadmins',
        );
      }
    }

    await this.usersRepository.softRemove(user);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
