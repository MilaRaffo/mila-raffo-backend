import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { LoggerService } from '../common/services/logger.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';
import { RoleName } from '../roles/entities/role.entity';
import { TokenType, BlacklistReason } from './entities/token-blacklist.entity';
import { UUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      // Obtener el rol client por defecto
      const clientRole = await this.rolesService.findByName(RoleName.CLIENT);
      if (!clientRole) {
        throw new BadRequestException('Client role not found. Please run seed first.');
      }

      const user = await this.usersService.create({
        ...registerDto,
        roleId: clientRole.id,
      });

      this.logger.userRegistered(user.id, user.email);

      const payload = this.buildPayload(user)

      return {
        accessToken: await this.getAccessToken(payload),
        refreshToken: await this.getRefreshToken(payload),
        user: this.mapUserResponse(user),
      };
    } catch (error) {
      this.logger.error(`Registration failed for email: ${registerDto.email}`, error.stack, {
        email: registerDto.email,
        error: error.message,
      });
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        this.logger.security('Login attempt failed - User not found', { email });
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await this.usersService.validatePassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.security('Login attempt failed - Invalid password', {
          userId: user.id,
          email,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        this.logger.security('Login attempt failed - Inactive account', {
          userId: user.id,
          email,
        });
        throw new UnauthorizedException('User account is inactive');
      }

      this.logger.userLogin(user.id, user.email);

      const payload = this.buildPayload(user)
      
      return {
        accessToken: await this.getAccessToken(payload),
        refreshToken: await this.getRefreshToken(payload),
        user: this.mapUserResponse(user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Login error', error.stack, { email });
      throw new UnauthorizedException('Login failed');
    }
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch (error) {
      this.logger.invalidToken(token, error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive)
        throw new UnauthorizedException('Invalid refresh token');

      const newPayload = this.buildPayload(user);

      return {
        accessToken: await this.getAccessToken(newPayload),
        refreshToken: await this.getRefreshToken(newPayload),
        user: this.mapUserResponse(user),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) return null;

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) return null;

    return user;
  }

  private buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };
  }

  private async getAccessToken(payload: JwtPayload) {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }

  private async getRefreshToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload, {
      expiresIn: '14d',
    });
  }
  private mapUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    };
  }

  async logout(
    accessToken: string,
    refreshToken?: string,
    userId?: UUID,
  ): Promise<{ message: string }> {
    try {
      // Decodificar el access token para obtener el userId si no se proporciona
      const payload = this.jwtService.decode(accessToken) as JwtPayload;
      const userIdToUse = userId || payload?.sub;

      if (!userIdToUse) {
        throw new BadRequestException('Invalid token or user ID');
      }

      // Agregar access token a la blacklist
      await this.tokenBlacklistService.addToBlacklist(
        accessToken,
        TokenType.ACCESS,
        userIdToUse,
        BlacklistReason.LOGOUT,
        'User initiated logout',
      );

      // Si se proporciona refresh token, también agregarlo a la blacklist
      if (refreshToken) {
        await this.tokenBlacklistService.addToBlacklist(
          refreshToken,
          TokenType.REFRESH,
          userIdToUse,
          BlacklistReason.LOGOUT,
          'User initiated logout',
        );
      }

      return { message: 'Logout successful' };
    } catch (error) {
      throw new BadRequestException('Logout failed: ' + error.message);
    }
  }

  async invalidateUserTokens(
    userId: UUID,
    reason: BlacklistReason,
  ): Promise<void> {
    await this.tokenBlacklistService.invalidateAllUserTokens(
      userId,
      reason,
      'All tokens invalidated',
    );
  }
}
