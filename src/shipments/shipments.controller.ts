import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RoleName } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentsService } from './shipments.service';

@ApiTags('shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all shipments (user sees only their shipments)',
  })
  @ApiResponse({ status: 200, description: 'Shipments retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto, @GetUser() user: User) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.shipmentsService.findAll(paginationDto, user.id, isAdmin);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get shipment by order ID' })
  @ApiResponse({ status: 200, description: 'Shipment found' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findByOrder(
    @Param('orderId', ParseUUIDPipe) orderId: UUID,
    @GetUser() user: User,
  ) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.shipmentsService.findByOrder(orderId, user.id, isAdmin);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shipment by ID' })
  @ApiResponse({ status: 200, description: 'Shipment found' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.shipmentsService.findOne(id, user.id, isAdmin);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPERADMIN)
  @ApiOperation({ summary: 'Update shipment status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Shipment updated successfully' })
  @ApiResponse({ status: 404, description: 'Shipment not found' })
  update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateShipmentDto: UpdateShipmentDto,
  ) {
    return this.shipmentsService.update(id, updateShipmentDto);
  }
}
