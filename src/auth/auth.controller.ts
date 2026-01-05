import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, UnauthorizedException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { RoleName } from '../roles/entities/role.entity';
import type { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new user account with CLIENT role by default'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'user@example.com',
          name: 'John',
          lastName: 'Doe',
          role: { id: 'uuid', name: 'client' }
        },
        access_token: 'jwt-token',
        refresh_token: 'refresh-jwt-token'
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login with email and password',
    description: 'Authenticates a user and returns access and refresh tokens'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'user@example.com',
          name: 'John',
          lastName: 'Doe',
          role: { id: 'uuid', name: 'client' }
        },
        access_token: 'jwt-token',
        refresh_token: 'refresh-jwt-token'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or user inactive' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login for admin panel (admin and superadmin only)',
    description: 'Authenticates admin users and verifies they have ADMIN or SUPERADMIN role'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin login successful',
    schema: {
      example: {
        user: {
          id: 'uuid',
          email: 'admin@example.com',
          name: 'Admin',
          lastName: 'User',
          role: { id: 'uuid', name: 'admin' }
        },
        access_token: 'jwt-token',
        refresh_token: 'refresh-jwt-token'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials, insufficient permissions, or user inactive' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async adminLogin(@Body() loginDto: LoginDto) {
    const response = await this.authService.login(loginDto);
    
    // Verificar que el usuario sea admin o superadmin
    const roleName = response.user.role.name;
    if (roleName !== RoleName.ADMIN && roleName !== RoleName.SUPERADMIN) {
      throw new UnauthorizedException('Access denied. Admin privileges required.');
    }
    
    return response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Logout and invalidate tokens',
    description: 'Invalidates the current access token and optionally the refresh token by adding them to the blacklist'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logout successful'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async logout(
    @Req() req: Request,
    @GetUser() user: User,
    @Body() logoutDto: LogoutDto,
  ) {
    // Extraer el access token del header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1];

    if (!accessToken) {
      throw new UnauthorizedException('Access token not found');
    }

    return this.authService.logout(
      accessToken,
      logoutDto.refreshToken,
      user.id,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      example: {
        access_token: 'new-jwt-token'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or blacklisted refresh token' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
