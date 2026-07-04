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
  DeleteObjectCommand,
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
    const secretAccessKey =
      this.configService.get<string>('s3.secretAccessKey');
    this.region = this.configService.get<string>('s3.region', 'us-east-1');
    this.bucket = this.configService.get<string>('s3.bucket') || '';

    // Log S3 configuration (without sensitive data)
    console.log('[Images] S3 Configuration:', {
      bucket: this.bucket,
      region: this.region,
      hasAccessKeyId: !!accessKeyId,
      hasSecretAccessKey: !!secretAccessKey,
    });

    if (!this.bucket) {
      throw new Error(
        '[Images] S3 bucket name is not configured in environment variables',
      );
    }

    if (!accessKeyId || !secretAccessKey) {
      console.warn(
        '[Images] AWS credentials not provided - will use IAM role or default credentials',
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });

    console.log('[Images] S3Client initialized successfully');
  }

  async create(
    createImageDto: CreateImageDto,
  ): Promise<Record<string, unknown>> {
    const image = this.imagesRepository.create(createImageDto);
    const savedImage = await this.imagesRepository.save(image);
    return this.findOne(savedImage.id);
  }

  async uploadFile(
    file: Express.Multer.File,
    variantId?: UUID,
    alt?: string,
  ): Promise<Record<string, unknown>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Validate S3 configuration
      if (!this.bucket) {
        throw new Error('S3 bucket is not configured');
      }

      console.log(
        `[Images] Starting S3 upload - Bucket: ${this.bucket}, Region: ${this.region}`,
      );

      // Generate unique file name
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const key = `images/${fileName}`;

      console.log(
        `[Images] File details - Original: ${file.originalname}, Size: ${file.size} bytes, Type: ${file.mimetype}`,
      );

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      console.log(`[Images] Sending to S3 with key: ${key}`);
      await this.s3Client.send(command);

      // Generate public URL
      const url = this.getPublicUrl(key);
      console.log(`[Images] File uploaded successfully - URL: ${url}`);

      // Create image record
      const image = this.imagesRepository.create({
        variantId: variantId || null,
        url,
        alt: alt || file.originalname,
      });

      const savedImage = await this.imagesRepository.save(image);
      return this.findOne(savedImage.id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      const s3Error = error as {
        Code?: string;
        statusCode?: number;
        RequestId?: string;
      };

      console.error(`[Images] S3 Upload Error:`, {
        name: errorName,
        message: errorMessage,
        code: s3Error?.Code,
        statusCode: s3Error?.statusCode,
        requestId: s3Error?.RequestId,
        fullError: error,
      });

      // Provide more specific error messages
      if (
        s3Error?.Code === 'InvalidAccessKeyId' ||
        s3Error?.Code === 'SignatureDoesNotMatch'
      ) {
        throw new InternalServerErrorException(
          'AWS credentials are invalid or not configured correctly',
        );
      }
      if (s3Error?.Code === 'NoSuchBucket') {
        throw new InternalServerErrorException(
          `S3 bucket "${this.bucket}" does not exist`,
        );
      }
      if (s3Error?.Code === 'AccessDenied') {
        throw new InternalServerErrorException(
          'Access denied to S3 bucket. Check IAM permissions.',
        );
      }

      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${errorMessage}`,
      );
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
      if (
        urlObj.hostname === `${this.bucket}.s3.${this.region}.amazonaws.com`
      ) {
        return pathname.substring(1);
      }

      return null;
    } catch {
      return null;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.imagesRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: ['variant'],
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map((image) => this.mapImage(image)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async findOne(id: UUID): Promise<Record<string, unknown>> {
    const image = await this.findOneEntity(id);
    return this.mapImage(image);
  }

  private async findOneEntity(id: UUID): Promise<Image> {
    const image = await this.imagesRepository.findOne({
      where: { id },
      relations: ['variant'],
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    return image;
  }

  async findByVariant(
    variantId: UUID,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const [data, total] = await this.imagesRepository.findAndCount({
      where: { variantId },
      take: limit,
      skip: offset,
      order: { createdAt: 'ASC' },
    });

    return {
      data: data.map((image) => this.mapImage(image)),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async update(
    id: UUID,
    updateImageDto: UpdateImageDto,
  ): Promise<Record<string, unknown>> {
    const image = await this.findOneEntity(id);
    Object.assign(image, updateImageDto);
    await this.imagesRepository.save(image);
    return this.findOne(id);
  }

  async remove(id: UUID): Promise<void> {
    const image = await this.findOneEntity(id);

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

  private mapImage(image: Image): Record<string, unknown> {
    return {
      id: image.id,
      url: image.url,
      alt: image.alt,
      variant: image.variant
        ? {
            id: image.variant.id,
            sku: image.variant.sku,
          }
        : null,
    };
  }
}
