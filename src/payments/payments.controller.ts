import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { type UUID } from 'crypto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  create(@Body() createPaymentDto: CreatePaymentDto, @GetUser() user: User) {
    return this.paymentsService.create(createPaymentDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments (user sees only their payments)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAll(@GetUser() user: User) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.paymentsService.findAll(user.id, isAdmin);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payments for a specific order' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findByOrder(
    @Param('orderId', ParseUUIDPipe) orderId: UUID,
    @GetUser() user: User,
  ) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.paymentsService.findByOrder(orderId, user.id, isAdmin);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.paymentsService.findOne(id, user.id, isAdmin);
  }

  @Patch(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Refund a payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  @ApiResponse({ status: 400, description: 'Payment cannot be refunded' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  refund(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    const isAdmin = [RoleName.ADMIN, RoleName.SUPERADMIN].includes(
      user.role.name,
    );
    return this.paymentsService.refund(id, isAdmin);
  }

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Webhook endpoint for payment gateways' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  handleWebhook(@Param('provider') provider: string, @Body() payload: any) {
    return this.paymentsService.handleWebhook(provider, payload);
  }
}
