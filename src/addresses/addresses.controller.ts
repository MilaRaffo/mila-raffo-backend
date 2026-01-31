import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { type UUID } from 'crypto';

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new address for the current user' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  create(@Body() createAddressDto: CreateAddressDto, @GetUser() user: User) {
    return this.addressesService.create(createAddressDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
  })
  findAll(@GetUser() user: User) {
    return this.addressesService.findAllByUser(user.id);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default address for the current user' })
  @ApiResponse({ status: 200, description: 'Default address found' })
  @ApiResponse({ status: 404, description: 'No default address found' })
  findDefault(@GetUser() user: User) {
    return this.addressesService.findDefault(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an address by ID' })
  @ApiResponse({ status: 200, description: 'Address found' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    return this.addressesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateAddressDto: UpdateAddressDto,
    @GetUser() user: User,
  ) {
    return this.addressesService.update(id, updateAddressDto, user.id);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set an address as default' })
  @ApiResponse({
    status: 200,
    description: 'Address set as default successfully',
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  setAsDefault(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    return this.addressesService.setAsDefault(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  remove(@Param('id', ParseUUIDPipe) id: UUID, @GetUser() user: User) {
    return this.addressesService.remove(id, user.id);
  }
}
