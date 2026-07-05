import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { Public } from '../common/decorators/public.decorator';
import { GameCategory } from '@prisma/client';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all games' })
  @ApiQuery({ name: 'category', required: false, enum: ['MOBILE', 'PC', 'CONSOLE', 'VOUCHER'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('category') category?: GameCategory,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.gamesService.findAll({ category, search, page, limit });
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get game by slug' })
  async findBySlug(@Param('slug') slug: string) {
    const game = await this.gamesService.findBySlug(slug);

    if (!game) {
      return { error: 'Game tidak ditemukan' };
    }

    return game;
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get game categories' })
  async getCategories() {
    return this.gamesService.getCategories();
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Get popular games' })
  async getPopular(@Query('limit') limit?: number) {
    return this.gamesService.getPopular(limit);
  }
}
