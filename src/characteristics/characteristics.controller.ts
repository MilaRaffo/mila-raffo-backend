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
import { CharacteristicsService } from './characteristics.service';
import { CreateCharacteristicDto } from './dto/create-characteristic.dto';
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('characteristics')
@Controller('characteristics')
export class CharacteristicsController {
  constructor(
    private readonly characteristicsService: CharacteristicsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new characteristic (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Characteristic created successfully',
  })
  create(@Body() createCharacteristicDto: CreateCharacteristicDto) {
    return this.characteristicsService.create(createCharacteristicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all characteristics with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Characteristics retrieved successfully',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.characteristicsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a characteristic by ID' })
  @ApiResponse({ status: 200, description: 'Characteristic found' })
  @ApiResponse({ status: 404, description: 'Characteristic not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.characteristicsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a characteristic (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Characteristic updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Characteristic not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCharacteristicDto: UpdateCharacteristicDto,
  ) {
    return this.characteristicsService.update(id, updateCharacteristicDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a characteristic (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Characteristic deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Characteristic not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.characteristicsService.remove(id);
  }
}
