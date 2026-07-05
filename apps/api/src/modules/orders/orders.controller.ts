import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new order' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.ordersService.findById(id, userId);
  }

  @Public()
  @Get('invoice/:invoiceNo')
  @ApiOperation({ summary: 'Get order by invoice number' })
  async findByInvoice(@Param('invoiceNo') invoiceNo: string) {
    return this.ordersService.findByInvoice(invoiceNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user orders' })
  async findByUser(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findByUser(userId, { page, limit });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment for order' })
  async checkout(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { paymentMethod: string },
  ) {
    return this.ordersService.checkout(id, userId, dto);
  }
}
