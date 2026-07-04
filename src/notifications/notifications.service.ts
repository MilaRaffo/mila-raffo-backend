import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { DeviceToken, type Platform } from './entities/device-token.entity';
import { type UUID } from 'crypto';

interface SendPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(DeviceToken)
    private readonly tokenRepository: Repository<DeviceToken>,
  ) {}

  async registerToken(
    userId: UUID,
    token: string,
    platform: Platform,
  ): Promise<void> {
    await this.tokenRepository.upsert(
      { userId, token, platform, notifyOffers: true, notifyOrders: true },
      { conflictPaths: ['userId', 'token'], skipUpdateIfNoValuesChanged: true },
    );
  }

  async unregisterToken(userId: UUID, token: string): Promise<void> {
    await this.tokenRepository.delete({ userId, token });
  }

  async updatePreferences(
    userId: UUID,
    preferences: { notifyOffers?: boolean; notifyOrders?: boolean },
  ): Promise<void> {
    await this.tokenRepository.update({ userId }, preferences);
  }

  async getPreferences(
    userId: UUID,
  ): Promise<{ notifyOffers: boolean; notifyOrders: boolean }> {
    const token = await this.tokenRepository.findOne({ where: { userId } });
    return {
      notifyOffers: token?.notifyOffers ?? true,
      notifyOrders: token?.notifyOrders ?? true,
    };
  }

  async sendToUser(userId: UUID, payload: SendPayload): Promise<void> {
    const tokens = await this.tokenRepository.find({ where: { userId } });
    if (!tokens.length) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }));

    await this.sendMessages(messages);
  }

  async sendToUserIfOrdersEnabled(
    userId: UUID,
    payload: SendPayload,
  ): Promise<void> {
    const tokens = await this.tokenRepository.find({
      where: { userId, notifyOrders: true },
    });
    if (!tokens.length) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }));

    await this.sendMessages(messages);
  }

  async sendBroadcast(payload: SendPayload): Promise<void> {
    const tokens = await this.tokenRepository.find({
      where: { notifyOffers: true },
    });
    if (!tokens.length) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }));

    await this.sendMessages(messages);
  }

  private async sendMessages(messages: ExpoPushMessage[]): Promise<void> {
    if (!messages.length) return;

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] =
          await this.expo.sendPushNotificationsAsync(chunk);

        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            this.logger.warn(`Push error: ${ticket.message}`);
          }
        }
      } catch (err) {
        this.logger.error('Failed to send push chunk', err);
      }
    }
  }
}
