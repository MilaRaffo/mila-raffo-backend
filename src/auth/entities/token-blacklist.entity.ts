import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'reset_password',
  EMAIL_VERIFICATION = 'email_verification',
}

export enum BlacklistReason {
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  TOKEN_USED = 'token_used',
  SECURITY_BREACH = 'security_breach',
  MANUAL_REVOCATION = 'manual_revocation',
}

@Entity('token_blacklist')
@Index(['token'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
export class TokenBlacklist extends BaseEntity {
  @Column({ type: 'text' })
  token: string;

  @Column({
    type: 'enum',
    enum: TokenType,
  })
  tokenType: TokenType;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: BlacklistReason,
  })
  reason: BlacklistReason;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
