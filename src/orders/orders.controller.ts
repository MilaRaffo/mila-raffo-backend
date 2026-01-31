import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { type UUID } from 'crypto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  create(@Body() createOrderDto: CreateOrderDto, @GetUser() user: User) {
    return this.ordersService.create(createOrderDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders (user sees only their orders)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto, @GetUser() user: User) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.ordersService.findAll(paginationDto, user.id, isAdmin);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get an order by order number' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
    @GetUser() user: User,
  ) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.ordersService.findByOrderNumber(orderNumber, user.id, isAdmin);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.ordersService.findOne(id, user.id, isAdmin);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateOrderDto: UpdateOrderDto,
    @GetUser() user: User,
  ) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.ordersService.update(id, updateOrderDto, user.id, isAdmin);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancel(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    return this.ordersService.cancel(id, user.id);
  }
}
