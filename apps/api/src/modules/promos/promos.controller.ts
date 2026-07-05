import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PromosService } from './promos.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Promos')
@Controller('promos')
export class PromosController {
  constructor(private promosService: PromosService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all active promos' })
  async findAll() {
    return this.promosService.findAll();
  }

  @Get('banners')
  @Public()
  @ApiOperation({ summary: 'Get promo banners' })
  async findBanners() {
    return this.promosService.findBanners();
  }
}
