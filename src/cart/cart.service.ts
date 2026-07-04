import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type UUID } from 'crypto';
import { CartItem } from './entities/cart-item.entity';
import { Variant } from '../variants/entities/variant.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
  ) {}

  async addItem(
    userId: UUID,
    dto: AddCartItemDto,
  ): Promise<Record<string, unknown>> {
    const variant = await this.variantRepository.findOne({
      where: { id: dto.variantId },
      relations: ['product', 'color', 'images'],
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    if (!variant.isAvailable || !variant.product.available) {
      throw new BadRequestException('This product variant is not available');
    }

    const existingItem = await this.cartItemRepository.findOne({
      where: { userId, variantId: dto.variantId },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      if (newQty > variant.stock) {
        throw new BadRequestException(
          `Cannot add ${dto.quantity} units. Only ${variant.stock - existingItem.quantity} more available in stock`,
        );
      }
      existingItem.quantity = newQty;
      await this.cartItemRepository.save(existingItem);
    } else {
      if (dto.quantity > variant.stock) {
        throw new BadRequestException(
          `Requested quantity exceeds available stock (${variant.stock})`,
        );
      }
      const newItem = this.cartItemRepository.create({
        userId,
        variantId: dto.variantId,
        quantity: dto.quantity,
      });
      await this.cartItemRepository.save(newItem);
    }

    return this.getCart(userId);
  }

  async getCart(userId: UUID): Promise<Record<string, unknown>> {
    const items = await this.cartItemRepository.find({
      where: { userId },
      relations: [
        'variant',
        'variant.product',
        'variant.color',
        'variant.images',
      ],
    });

    const mappedItems = items.map((item) => {
      const unitPrice = Number(item.variant.price);
      const subtotal = unitPrice * item.quantity;

      return {
        id: item.id,
        productId: item.variant.product.id,
        variantId: item.variantId,
        productName: item.variant.product.name,
        colorName: item.variant.color?.name ?? null,
        colorHex: item.variant.color?.hex ?? null,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        imageUrl: item.variant.images?.[0]?.url ?? null,
        stockAvailable: item.variant.stock,
      };
    });

    const total = mappedItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      items: mappedItems,
      total: Math.round(total * 100) / 100,
      itemCount: mappedItems.length,
    };
  }

  async updateItem(
    userId: UUID,
    itemId: UUID,
    dto: UpdateCartItemDto,
  ): Promise<Record<string, unknown>> {
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, userId },
      relations: ['variant'],
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity > item.variant.stock) {
      throw new BadRequestException(
        `Requested quantity exceeds available stock (${item.variant.stock})`,
      );
    }

    item.quantity = dto.quantity;
    await this.cartItemRepository.save(item);

    return this.getCart(userId);
  }

  async removeItem(userId: UUID, itemId: UUID): Promise<void> {
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(item);
  }

  async clearCart(userId: UUID): Promise<void> {
    await this.cartItemRepository.delete({ userId });
  }
}
