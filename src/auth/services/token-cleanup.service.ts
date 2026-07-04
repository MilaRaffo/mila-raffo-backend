import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {}

  /**
   * Ejecuta la limpieza de tokens expirados cada día a las 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    this.logger.log('Starting scheduled token cleanup...');

    try {
      const deletedCount =
        await this.tokenBlacklistService.cleanupExpiredTokens();
      this.logger.log(
        `Token cleanup completed. Removed ${deletedCount} expired tokens.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Token cleanup failed: ${message}`, stack);
    }
  }

  /**
   * Ejecuta la limpieza manualmente (útil para testing o admin)
   */
  async manualCleanup(): Promise<number> {
    this.logger.log('Manual token cleanup triggered...');
    return await this.tokenBlacklistService.cleanupExpiredTokens();
  }
}
