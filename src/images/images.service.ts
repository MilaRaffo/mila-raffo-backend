import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { Image } from './entities/image.entity';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { UUID } from 'crypto';

@Injectable()
export class ImagesService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(
    @InjectRepository(Image)
    private readonly imagesRepository: Repository<Image>,
    private readonly configService: ConfigService,
  ) {
    const accessKeyId = this.configService.get<string>('s3.accessKeyId');
    const secretAccessKey = this.configService.get<string>('s3.secretAccessKey');
    this.region = this.configService.get<string>('s3.region', 'us-east-1');
    this.bucket = this.configService.get<string>('s3.bucket') || '';

    if (!this.bucket) {
      throw new Error('S3 bucket name is not configured');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey,
      } : undefined,
    });
  }

  async create(createImageDto: CreateImageDto): Promise<Image> {
    const image = this.imagesRepository.create(createImageDto);
    return this.imagesRepository.save(image);
  }

  async uploadFile(
    file: Express.Multer.File,
    variantId?: UUID,
    alt?: string,
  ): Promise<Image> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Generate unique file name
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const key = `images/${fileName}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make the file publicly accessible
      });

      await this.s3Client.send(command);

      // Generate public URL
      const url = this.getPublicUrl(key);

      // Create image record
      const image = this.imagesRepository.create({
        variantId: variantId || null,
        url,
        alt: alt || file.originalname,
      });

      return this.imagesRepository.save(image);
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  private getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // For AWS S3 virtual-hosted-style URLs: https://bucket.s3.region.amazonaws.com/key
      if (urlObj.hostname === `${this.bucket}.s3.${this.region}.amazonaws.com`) {
        return pathname.substring(1);
      }
      
      return null;
    } catch {
      return null;
    }
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

  async findOne(id: UUID): Promise<Image> {
    const image = await this.imagesRepository.findOne({
      where: { id },
      relations: ['variant'],
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    return image;
  }

  async findByVariant(variantId: UUID): Promise<Image[]> {
    return this.imagesRepository.find({
      where: { variantId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: UUID, updateImageDto: UpdateImageDto): Promise<Image> {
    const image = await this.findOne(id);
    Object.assign(image, updateImageDto);
    return this.imagesRepository.save(image);
  }

  async remove(id: UUID): Promise<void> {
    const image = await this.findOne(id);

    // Delete file from S3
    try {
      const key = this.extractKeyFromUrl(image.url);
      
      if (key) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });

        await this.s3Client.send(command);
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to delete file from S3:', error);
    }

    await this.imagesRepository.softRemove(image);
  }
}
