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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VariantsService } from './variants.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { AddLeathersDto } from './dto/add-leathers.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { type UUID } from 'crypto';

@ApiTags('variants')
@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new variant (Admin only)' })
  @ApiResponse({ status: 201, description: 'Variant created successfully' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  create(@Body() createVariantDto: CreateVariantDto) {
    return this.variantsService.create(createVariantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all variants with pagination' })
  @ApiResponse({ status: 200, description: 'Variants retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.variantsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a variant by ID' })
  @ApiResponse({ status: 200, description: 'Variant found' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.variantsService.findOne(id);
  }

  @Post(':id/leathers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add leathers to a variant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Leathers added successfully' })
  @ApiResponse({ status: 404, description: 'Variant or leather not found' })
  addLeathers(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() addLeathersDto: AddLeathersDto,
  ) {
    return this.variantsService.addLeathersToVariant(
      id,
      addLeathersDto.leatherIds,
    );
  }

  @Delete(':id/leathers/:leatherId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a leather from a variant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Leather removed successfully' })
  @ApiResponse({ status: 404, description: 'Variant or leather not found' })
  removeLeather(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Param('leatherId', ParseIntPipe) leatherId: UUID,
  ) {
    return this.variantsService.removeLeatherFromVariant(id, leatherId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a variant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Variant updated successfully' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateVariantDto: UpdateVariantDto,
  ) {
    return this.variantsService.update(id, updateVariantDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a variant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Variant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  remove(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.variantsService.remove(id);
  }
}
