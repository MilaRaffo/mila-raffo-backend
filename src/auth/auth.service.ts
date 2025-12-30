import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const user = await this.usersService.create({
        ...registerDto,
        role: UserRole.USER,
      });

      const payload = this.buildPayload(user)

      return {
        accessToken: await this.getAccessToken(payload),
        refreshToken: await this.getRefreshToken(payload),
        user: this.mapUserResponse(user),
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive)
      throw new UnauthorizedException('User account is inactive');

    const payload = this.buildPayload(user)
    
    return {
      accessToken: await this.getAccessToken(payload),
      refreshToken: await this.getRefreshToken(payload),
      user: this.mapUserResponse(user),
    };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch {
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
      role: user.role,
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
      role: user.role,
    };
  }
}
