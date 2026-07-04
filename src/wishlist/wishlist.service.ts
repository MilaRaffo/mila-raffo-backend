import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type UUID } from 'crypto';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Variant } from '../variants/entities/variant.entity';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
  ) {}

  async addItem(
    userId: UUID,
    dto: AddWishlistItemDto,
  ): Promise<Record<string, unknown>> {
    const variant = await this.variantRepository.findOne({
      where: { id: dto.variantId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const existingItem = await this.wishlistRepository.findOne({
      where: { userId, variantId: dto.variantId },
    });

    if (existingItem) {
      throw new ConflictException('Variant is already in your wishlist');
    }

    const newItem = this.wishlistRepository.create({
      userId,
      variantId: dto.variantId,
    });
    await this.wishlistRepository.save(newItem);

    return this.getWishlist(userId);
  }

  async getWishlist(userId: UUID): Promise<Record<string, unknown>> {
    const items = await this.wishlistRepository.find({
      where: { userId },
      relations: [
        'variant',
        'variant.product',
        'variant.color',
        'variant.images',
      ],
      order: { createdAt: 'DESC' },
    });

    const mappedItems = items.map((item) => ({
      id: item.id,
      productId: item.variant.product.id,
      variantId: item.variantId,
      productName: item.variant.product.name,
      colorName: item.variant.color?.name ?? null,
      colorHex: item.variant.color?.hex ?? null,
      price: Number(item.variant.price),
      imageUrl: item.variant.images?.[0]?.url ?? null,
      stockAvailable: item.variant.stock,
      isAvailable: item.variant.isAvailable,
      addedAt: item.createdAt,
    }));

    return {
      items: mappedItems,
      count: mappedItems.length,
    };
  }

  async removeItem(userId: UUID, itemId: UUID): Promise<void> {
    const item = await this.wishlistRepository.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.wishlistRepository.remove(item);
  }
}
