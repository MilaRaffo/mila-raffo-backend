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
  ParseIntPipe,
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

@ApiTags('leathers')
@Controller('leathers')
export class LeathersController {
  constructor(private readonly leathersService: LeathersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new leather type (Admin only)' })
  @ApiResponse({ status: 201, description: 'Leather created successfully' })
  @ApiResponse({ status: 409, description: 'Leather code already exists' })
  create(@Body() createLeatherDto: CreateLeatherDto) {
    return this.leathersService.create(createLeatherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leathers with pagination' })
  @ApiResponse({ status: 200, description: 'Leathers retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.leathersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a leather by ID' })
  @ApiResponse({ status: 200, description: 'Leather found' })
  @ApiResponse({ status: 404, description: 'Leather not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leathersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a leather (Admin only)' })
  @ApiResponse({ status: 200, description: 'Leather updated successfully' })
  @ApiResponse({ status: 404, description: 'Leather not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeatherDto: UpdateLeatherDto,
  ) {
    return this.leathersService.update(id, updateLeatherDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a leather (Admin only)' })
  @ApiResponse({ status: 200, description: 'Leather deleted successfully' })
  @ApiResponse({ status: 404, description: 'Leather not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.leathersService.remove(id);
  }
}
