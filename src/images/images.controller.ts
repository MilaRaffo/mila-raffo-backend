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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { UUID } from 'crypto';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an image record (Admin only)' })
  @ApiResponse({ status: 201, description: 'Image created successfully' })
  create(@Body() createImageDto: CreateImageDto) {
    return this.imagesService.create(createImageDto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image file (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        variantId: {
          type: 'number',
          nullable: true,
        },
        alt: {
          type: 'string',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('variantId') variantId?: UUID,
    @Body('alt') alt?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10);
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize} bytes`,
      );
    }

    return this.imagesService.uploadFile(file, variantId, alt);
  }

  @Get()
  @ApiOperation({ summary: 'Get all images with pagination' })
  @ApiResponse({ status: 200, description: 'Images retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.imagesService.findAll(paginationDto);
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get images by variant ID' })
  @ApiResponse({ status: 200, description: 'Images retrieved successfully' })
  findByVariant(@Param('variantId', ParseUUIDPipe) variantId: UUID) {
    return this.imagesService.findByVariant(variantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an image by ID' })
  @ApiResponse({ status: 200, description: 'Image found' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.imagesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an image (Admin only)' })
  @ApiResponse({ status: 200, description: 'Image updated successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateImageDto: UpdateImageDto,
  ) {
    return this.imagesService.update(id, updateImageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an image (Admin only)' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  remove(@Param('id', ParseUUIDPipe) id: UUID) {
    return this.imagesService.remove(id);
  }
}
