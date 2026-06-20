import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { UnregisterTokenDto } from './dto/unregister-token.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { BroadcastDto } from './dto/broadcast.dto';
import { TestNotificationDto } from './dto/test-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register device push token' })
  @ApiResponse({ status: 204, description: 'Token registered' })
  async register(
    @GetUser() user: User,
    @Body() dto: RegisterTokenDto,
  ): Promise<void> {
    await this.notificationsService.registerToken(user.id, dto.token, dto.platform);
  }

  @Delete('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unregister device push token' })
  @ApiResponse({ status: 204, description: 'Token removed' })
  async unregister(
    @GetUser() user: User,
    @Body() dto: UnregisterTokenDto,
  ): Promise<void> {
    await this.notificationsService.unregisterToken(user.id, dto.token);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(
    @GetUser() user: User,
  ): Promise<{ notifyOffers: boolean; notifyOrders: boolean }> {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 204, description: 'Preferences updated' })
  async updatePreferences(
    @GetUser() user: User,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<void> {
    await this.notificationsService.updatePreferences(user.id, dto);
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPERADMIN)
  @ApiOperation({ summary: 'Send broadcast notification (admin only)' })
  @ApiResponse({ status: 204, description: 'Broadcast sent' })
  async broadcast(@Body() dto: BroadcastDto): Promise<void> {
    await this.notificationsService.sendBroadcast({
      title: dto.title,
      body: dto.body,
      data: { type: 'offer' },
    });
  }

  @Post('test')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Send a test push notification to yourself',
    description:
      'Sends a test push to all devices registered for the authenticated user. Useful for verifying the notification pipeline without creating real orders.',
  })
  @ApiResponse({ status: 204, description: 'Test notification sent' })
  @ApiResponse({ status: 404, description: 'No registered device tokens found for this user' })
  async test(
    @GetUser() user: User,
    @Body() dto: TestNotificationDto,
  ): Promise<void> {
    const type = dto.type ?? 'order_status';

    const payloads: Record<typeof type, { title: string; body: string; data: Record<string, unknown> }> = {
      order_status: {
        title: 'Pedido #TEST-001',
        body: 'Tu pedido está confirmado. 🎉',
        data: { type: 'order_status', orderId: '00000000-0000-0000-0000-000000000000' },
      },
      shipment_status: {
        title: 'Pedido #TEST-001',
        body: 'Tu envío está en camino.',
        data: { type: 'shipment_status', orderId: '00000000-0000-0000-0000-000000000000' },
      },
      offer: {
        title: '¡Nueva oferta en Mila Raffo!',
        body: 'Descuentos de hasta 40% en toda la colección.',
        data: { type: 'offer' },
      },
    };

    const preferences = await this.notificationsService.getPreferences(user.id);
    const hasToken = preferences.notifyOffers || preferences.notifyOrders;

    if (!hasToken) {
      throw new NotFoundException('No registered device tokens found for this user. Login from the mobile app first.');
    }

    await this.notificationsService.sendToUser(user.id, payloads[type]);
  }
}
