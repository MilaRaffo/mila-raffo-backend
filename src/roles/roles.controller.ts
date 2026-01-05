import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from './entities/role.entity';
import { type UUID } from 'crypto';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(RoleName.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new role (Superadmin only)' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Roles(RoleName.SUPERADMIN)
  @ApiOperation({ summary: 'Get all roles (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles(RoleName.SUPERADMIN)
  @ApiOperation({ summary: 'Get a role by ID (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'Role found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleName.SUPERADMIN)
  @ApiOperation({ summary: 'Update a role (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  update(@Param('id', ParseUUIDPipe) id: UUID, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Roles(RoleName.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a role (Superadmin only)' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Superadmin access required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete role with associated users' })
  remove(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.rolesService.remove(id);
  }
}
