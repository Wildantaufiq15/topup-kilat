import { Controller, Post, Body, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('webhooks')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('payment')
  @ApiOperation({ summary: 'Handle payment gateway webhook' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }
}
