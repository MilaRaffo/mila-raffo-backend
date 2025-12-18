import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly imagesRepository: Repository<Image>,
  ) {}

  async create(createImageDto: CreateImageDto): Promise<Image> {
    const image = this.imagesRepository.create(createImageDto);
    return this.imagesRepository.save(image);
  }

  async uploadFile(
    file: Express.Multer.File,
    variantId?: number,
    alt?: string,
  ): Promise<Image> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadPath = process.env.UPLOAD_DESTINATION || './uploads';
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadPath, fileName);
    
    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Create image record
    const url = `/uploads/${fileName}`;
    const image = this.imagesRepository.create({
      variantId: variantId || null,
      url,
      alt: alt || file.originalname,
    });

    return this.imagesRepository.save(image);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Image>> {
    const { limit, offset } = paginationDto;

    const [data, total] = await this.imagesRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['variant'],
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: number): Promise<Image> {
    const image = await this.imagesRepository.findOne({
      where: { id },
      relations: ['variant'],
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    return image;
  }

  async findByVariant(variantId: number): Promise<Image[]> {
    return this.imagesRepository.find({
      where: { variantId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: number, updateImageDto: UpdateImageDto): Promise<Image> {
    const image = await this.findOne(id);
    Object.assign(image, updateImageDto);
    return this.imagesRepository.save(image);
  }

  async remove(id: number): Promise<void> {
    const image = await this.findOne(id);

    // Optionally delete the physical file
    try {
      const filePath = path.join(process.cwd(), image.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to delete physical file:', error);
    }

    await this.imagesRepository.softRemove(image);
  }
}
