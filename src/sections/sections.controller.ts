import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateSectionItemDto } from './dto/create-section-item.dto';
import { UpdateSectionItemDto } from './dto/update-section-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { type UUID } from 'crypto';

@ApiTags('sections')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  // SECTIONS endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new section' })
  create(@Body() createSectionDto: CreateSectionDto) {
    return this.sectionsService.createSection(createSectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sections with pagination' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.sectionsService.findAllSections(paginationDto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active sections (for frontend)' })
  findAllActive() {
    return this.sectionsService.findAllSectionsActive();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get section by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.sectionsService.findSectionBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get section by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.sectionsService.findSectionById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update section' })
  update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return this.sectionsService.updateSection(id, updateSectionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete section' })
  remove(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.sectionsService.removeSection(id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder sections' })
  reorderSections(@Body() sectionIds: UUID[]) {
    return this.sectionsService.reorderSections(sectionIds);
  }

  // SECTION ITEMS endpoints
  @Post(':id/items')
  @ApiOperation({ summary: 'Create section item' })
  createItem(@Body() createSectionItemDto: CreateSectionItemDto) {
    return this.sectionsService.createSectionItem(createSectionItemDto);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Get section items' })
  findAllItems(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.sectionsService.findAllSectionItems(id, paginationDto);
  }

  @Get('items/:itemId')
  @ApiOperation({ summary: 'Get section item by ID' })
  findOneItem(@Param('itemId', ParseUUIDPipe) itemId: UUID) {
    return this.sectionsService.findSectionItemById(itemId);
  }

  @Put('items/:itemId')
  @ApiOperation({ summary: 'Update section item' })
  updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: UUID,
    @Body() updateSectionItemDto: UpdateSectionItemDto,
  ) {
    return this.sectionsService.updateSectionItem(itemId, updateSectionItemDto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Delete section item' })
  removeItem(@Param('itemId', ParseUUIDPipe) itemId: UUID) {
    return this.sectionsService.removeSectionItem(itemId);
  }

  @Post('items/reorder')
  @ApiOperation({ summary: 'Reorder section items' })
  reorderItems(@Body() itemIds: UUID[]) {
    return this.sectionsService.reorderSectionItems(itemIds);
  }
}
