import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { TokenCleanupService } from './services/token-cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenBlacklist]),
    UsersModule,
    RolesModule,
    PassportModule,
    JwtModule.register({}),
    ConfigModule,
     PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: { expiresIn: '1d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TokenBlacklistService,
    TokenCleanupService,
  ],
  exports: [AuthService, TokenBlacklistService],
})
export class AuthModule {}
