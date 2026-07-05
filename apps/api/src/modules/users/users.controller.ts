import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('points')
  @ApiOperation({ summary: 'Get user points history' })
  async getPointsHistory(
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.getPointsHistory(userId);
  }

  @Get('wishlist')
  @ApiOperation({ summary: 'Get user wishlist' })
  async getWishlist(@CurrentUser('id') userId: string) {
    return this.usersService.getWishlist(userId);
  }

  @Post('wishlist/:gameId')
  @ApiOperation({ summary: 'Add game to wishlist' })
  async addToWishlist(
    @CurrentUser('id') userId: string,
    @Param('gameId') gameId: string,
  ) {
    return this.usersService.addToWishlist(userId, gameId);
  }

  @Delete('wishlist/:gameId')
  @ApiOperation({ summary: 'Remove game from wishlist' })
  async removeFromWishlist(
    @CurrentUser('id') userId: string,
    @Param('gameId') gameId: string,
  ) {
    return this.usersService.removeFromWishlist(userId, gameId);
  }
}
