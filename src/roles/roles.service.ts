import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { type UUID } from 'crypto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Record<string, unknown>> {
    const existingRole = await this.rolesRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(
        `Role with name '${createRoleDto.name}' already exists`,
      );
    }

    const role = this.rolesRepository.create(createRoleDto);
    const savedRole = await this.rolesRepository.save(role);
    return this.findOne(savedRole.id);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.rolesRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'ASC' },
    });

    return {
      data: data.map((role) => this.mapRole(role)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const role = await this.findOneEntity(id);
    return this.mapRole(role);
  }

  private async findOneEntity(id: UUID): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }
    return role;
  }

  async findByName(name: RoleName): Promise<Role | null> {
    return await this.rolesRepository.findOne({ where: { name } });
  }

  async update(
    id: UUID,
    updateRoleDto: UpdateRoleDto,
  ): Promise<Record<string, unknown>> {
    const role = await this.findOneEntity(id);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.rolesRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(
          `Role with name '${updateRoleDto.name}' already exists`,
        );
      }
    }

    Object.assign(role, updateRoleDto);
    await this.rolesRepository.save(role);
    return this.findOne(id);
  }

  async remove(id: UUID): Promise<void> {
    const role = await this.findOneEntity(id);
    await this.rolesRepository.remove(role);
  }

  private mapRole(role: Role): Record<string, unknown> {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
    };
  }
}
