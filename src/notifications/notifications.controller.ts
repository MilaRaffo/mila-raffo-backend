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
}
