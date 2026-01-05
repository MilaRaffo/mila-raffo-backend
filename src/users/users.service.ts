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
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { type UUID } from 'crypto';
import { RoleName } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
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

    return this.usersRepository.save(user);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<User>> {
    const { limit, offset } = paginationDto;

    const [data, total] = await this.usersRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: UUID): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: UUID, updateUserDto: UpdateUserDto, currentUserRole?: RoleName): Promise<User> {
    const user = await this.findOne(id);

    // Si el usuario actual es admin, verificar que no intente modificar admins o superadmins
    if (currentUserRole === RoleName.ADMIN) {
      if (user.role.name === RoleName.ADMIN || user.role.name === RoleName.SUPERADMIN) {
        throw new ForbiddenException('Admins cannot modify other admins or superadmins');
      }
      // Admins no pueden cambiar roles
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
    return this.usersRepository.save(user);
  }

  async updatePassword(id: UUID, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);
  }

  async remove(id: UUID, currentUserRole?: RoleName): Promise<void> {
    const user = await this.findOne(id);

    // Si el usuario actual es admin, verificar que no intente eliminar admins o superadmins
    if (currentUserRole === RoleName.ADMIN) {
      if (user.role.name === RoleName.ADMIN || user.role.name === RoleName.SUPERADMIN) {
        throw new ForbiddenException('Admins cannot delete other admins or superadmins');
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
