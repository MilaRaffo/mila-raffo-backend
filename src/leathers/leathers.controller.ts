import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LeathersService } from './leathers.service';
import { CreateLeatherDto } from './dto/create-leather.dto';
import { UpdateLeatherDto } from './dto/update-leather.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { type UUID } from 'crypto';

@ApiTags('colors')
@Controller('leathers')
export class LeathersController {
  constructor(private readonly leathersService: LeathersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new color (Admin only)' })
  @ApiResponse({ status: 201, description: 'Color created successfully' })
  @ApiResponse({ status: 409, description: 'Color code already exists' })
  create(@Body() createLeatherDto: CreateLeatherDto) {
    return this.leathersService.create(createLeatherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all colors with pagination' })
  @ApiResponse({ status: 200, description: 'Colors retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.leathersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a color by ID' })
  @ApiResponse({ status: 200, description: 'Color found' })
  @ApiResponse({ status: 404, description: 'Color not found' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.leathersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a color (Admin only)' })
  @ApiResponse({ status: 200, description: 'Color updated successfully' })
  @ApiResponse({ status: 404, description: 'Color not found' })
  update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateLeatherDto: UpdateLeatherDto,
  ) {
    return this.leathersService.update(id, updateLeatherDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a color (Admin only)' })
  @ApiResponse({ status: 200, description: 'Color deleted successfully' })
  @ApiResponse({ status: 404, description: 'Color not found' })
  remove(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.leathersService.remove(id);
  }
}
