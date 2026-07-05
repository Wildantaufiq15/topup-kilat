import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private vouchersService: VouchersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vouchers' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.vouchersService.findAll({ page, limit });
  }

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate voucher code' })
  async validate(
    @Body() body: { code: string; amount?: number },
  ) {
    return this.vouchersService.validate(body.code, body.amount);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active vouchers' })
  async findActive() {
    return this.vouchersService.findActive();
  }
}
