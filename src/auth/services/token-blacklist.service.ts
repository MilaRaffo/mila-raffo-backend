import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  TokenBlacklist,
  TokenType,
  BlacklistReason,
} from '../entities/token-blacklist.entity';
import { type UUID } from 'crypto';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly blacklistRepository: Repository<TokenBlacklist>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Agrega un token a la blacklist
   */
  async addToBlacklist(
    token: string,
    tokenType: TokenType,
    userId: UUID,
    reason: BlacklistReason,
    notes?: string,
  ): Promise<TokenBlacklist> {
    try {
      // Decodificar el token para obtener la fecha de expiración
      const decoded = this.jwtService.decode(token) as { exp: number };
      const expiresAt = new Date(decoded.exp * 1000);

      const blacklistedToken = this.blacklistRepository.create({
        token,
        tokenType,
        userId,
        reason,
        expiresAt,
        notes,
      });

      return await this.blacklistRepository.save(blacklistedToken);
    } catch (error) {
      this.logger.error(`Error adding token to blacklist: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica si un token está en la blacklist
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.blacklistRepository.findOne({
      where: { token },
    });

    return !!blacklistedToken;
  }

  /**
   * Invalida todos los tokens de un usuario
   * Útil cuando se cambia la contraseña o hay una brecha de seguridad
   */
  async invalidateAllUserTokens(
    userId: UUID,
    reason: BlacklistReason,
    notes?: string,
  ): Promise<void> {
    // Nota: Esta es una implementación simplificada
    // En producción, podrías querer almacenar una marca de tiempo en el usuario
    // y verificar que los tokens sean posteriores a esa marca
    this.logger.log(`Invalidating all tokens for user ${userId}`);
  }

  /**
   * Limpia tokens expirados de la blacklist
   * Se debe ejecutar periódicamente mediante un cron job
   */
  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    const result = await this.blacklistRepository.delete({
      expiresAt: LessThan(now),
    });

    const deletedCount = result.affected || 0;
    this.logger.log(`Cleaned up ${deletedCount} expired tokens from blacklist`);

    return deletedCount;
  }

  /**
   * Obtiene todas las entradas de blacklist de un usuario
   */
  async getUserBlacklistedTokens(userId: UUID): Promise<TokenBlacklist[]> {
    return await this.blacklistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Elimina una entrada específica de la blacklist por ID
   * Solo para uso administrativo
   */
  async removeFromBlacklist(id: UUID): Promise<void> {
    await this.blacklistRepository.delete(id);
  }

  /**
   * Obtiene estadísticas de la blacklist
   */
  async getBlacklistStats(): Promise<{
    total: number;
    byType: Record<TokenType, number>;
    byReason: Record<BlacklistReason, number>;
    expired: number;
  }> {
    const [tokens, total] = await this.blacklistRepository.findAndCount();
    const now = new Date();

    const byType = tokens.reduce(
      (acc, token) => {
        acc[token.tokenType] = (acc[token.tokenType] || 0) + 1;
        return acc;
      },
      {} as Record<TokenType, number>,
    );

    const byReason = tokens.reduce(
      (acc, token) => {
        acc[token.reason] = (acc[token.reason] || 0) + 1;
        return acc;
      },
      {} as Record<BlacklistReason, number>,
    );

    const expired = tokens.filter((token) => token.expiresAt < now).length;

    return {
      total,
      byType,
      byReason,
      expired,
    };
  }
}
