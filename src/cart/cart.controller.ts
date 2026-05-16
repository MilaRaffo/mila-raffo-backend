import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type UUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  @ApiOperation({ summary: 'Add a variant to the cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  @ApiResponse({ status: 400, description: 'Invalid quantity or exceeds stock' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  addItem(
    @Body() addCartItemDto: AddCartItemDto,
    @GetUser() user: User,
  ) {
    return this.cartService.addItem(user.id as UUID, addCartItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  getCart(@GetUser() user: User) {
    return this.cartService.getCart(user.id as UUID);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 400, description: 'Quantity exceeds stock' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  updateItem(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @GetUser() user: User,
  ) {
    return this.cartService.updateItem(user.id as UUID, id, updateCartItemDto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiResponse({ status: 204, description: 'Cart item removed' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  removeItem(
    @Param('id', ParseUUIDPipe) id: UUID,
    @GetUser() user: User,
  ) {
    return this.cartService.removeItem(user.id as UUID, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear the entire cart' })
  @ApiResponse({ status: 204, description: 'Cart cleared' })
  clearCart(@GetUser() user: User) {
    return this.cartService.clearCart(user.id as UUID);
  }
}
