import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { WishlistService } from './wishlist.service';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';

@ApiTags('wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('items')
  @ApiOperation({ summary: 'Add a variant to the wishlist' })
  @ApiResponse({ status: 201, description: 'Item added to wishlist' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  @ApiResponse({ status: 409, description: 'Variant already in wishlist' })
  addItem(
    @Body() addWishlistItemDto: AddWishlistItemDto,
    @GetUser() user: User,
  ) {
    return this.wishlistService.addItem(user.id, addWishlistItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
  getWishlist(@GetUser() user: User) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an item from the wishlist' })
  @ApiResponse({ status: 204, description: 'Wishlist item removed' })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  removeItem(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    return this.wishlistService.removeItem(user.id, id);
  }
}
