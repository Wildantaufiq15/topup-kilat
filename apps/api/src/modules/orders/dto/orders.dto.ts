import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'mobile-legends' })
  @IsString()
  gameSlug: string;

  @ApiProperty({ example: 'uuid-product-id' })
  @IsString()
  productId: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  userGameId: string;

  @ApiPropertyOptional({ example: '2222' })
  @IsOptional()
  @IsString()
  serverId?: string;

  @ApiPropertyOptional({ example: 'HEMAT10' })
  @IsOptional()
  @IsString()
  voucherCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
