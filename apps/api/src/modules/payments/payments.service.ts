import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Order, PaymentMethod } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createPayment(order: Order, method: string) {
    // Calculate expiry (60 minutes from now)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 60);

    // In production, this would call Sakurupiah API
    // For now, we simulate the payment creation
    const providerRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Mock payment URL based on method
    let paymentUrl = '';
    let qrCode = '';
    let vaNumber = '';

    switch (method) {
      case 'QRIS':
        qrCode = this.generateMockQRCode();
        paymentUrl = `sakurupiah://qris/${providerRef}`;
        break;
      case 'BCA_VA':
      case 'BNI_VA':
      case 'MANDIRI_VA':
      case 'BRI_VA':
      case 'PERMATA_VA':
        vaNumber = this.generateVANumber(method);
        paymentUrl = vaNumber;
        break;
      default:
        paymentUrl = `sakurupiah://pay/${providerRef}`;
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: method as PaymentMethod,
        amount: order.total,
        providerRef,
        qrCode,
        vaNumber,
        paymentUrl,
        expiredAt,
        instructions: this.getInstructions(method),
      },
    });

    return payment;
  }

  async handleWebhook(payload: any, signature: string) {
    // Verify signature
    const isValid = this.verifySignature(payload, signature);

    // Find payment first by order ID
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: payload.order_id },
      include: { order: true },
    });

    // Log webhook with payment ID if found, otherwise use order_id as placeholder
    await this.prisma.paymentWebhookLog.create({
      data: {
        paymentId: payment?.id || payload.order_id,
        payload,
        signature,
        isValid,
        processedAt: new Date(),
      },
    });

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    if (!payment) {
      throw new Error('Payment not found');
    }

    switch (payload.status) {
      case 'PAID':
        await this.handlePaymentSuccess(payment);
        break;
      case 'EXPIRED':
        await this.handlePaymentExpired(payment);
        break;
      case 'FAILED':
        await this.handlePaymentFailed(payment);
        break;
    }

    return { received: true };
  }

  private async handlePaymentSuccess(payment: any) {
    await this.prisma.$transaction([
      // Update payment status
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      }),
      // Update order status
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      }),
      // TODO: Trigger supplier API call
    ]);
  }

  private async handlePaymentExpired(payment: any) {
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'EXPIRED' },
      }),
      // Refund voucher usage if any
      ...(payment.order.voucherId
        ? [
            this.prisma.voucher.update({
              where: { id: payment.order.voucherId },
              data: { usedQuota: { decrement: 1 } },
            }),
          ]
        : []),
    ]);
  }

  private async handlePaymentFailed(payment: any) {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });
  }

  private verifySignature(payload: any, signature: string): boolean {
    const secret = this.configService.get('SAKURUPIAH_WEBHOOK_SECRET') || 'default-secret';
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return computedSignature === signature;
  }

  private generateMockQRCode(): string {
    // In production, this would be returned from Sakurupiah
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }

  private generateVANumber(method: string): string {
    const prefix: Record<string, string> = {
      BCA_VA: '88088',
      BNI_VA: '88012',
      MANDIRI_VA: '88013',
      BRI_VA: '88011',
      PERMATA_VA: '88088',
    };
    const num = Math.floor(Math.random() * 10000000000)
      .toString()
      .padStart(10, '0');
    return `${prefix[method] || '88088'}${num}`;
  }

  private getInstructions(method: string): string {
    const instructions: Record<string, string> = {
      QRIS: 'Scan QR code menggunakan aplikasi m-banking atau e-wallet Anda',
      BCA_VA: '1. Buka aplikasi BCA mobile\n2. Pilih m-Transfer\n3. Pilih Virtual Account\n4. Masukkan nomor VA\n5. Konfirmasi pembayaran',
      BNI_VA: '1. Buka aplikasi BNI Mobile\n2. Pilih Transfer\n3. Pilih Virtual Account\n4. Masukkan nomor VA\n5. Konfirmasi pembayaran',
      MANDIRI_VA: '1. Buka aplikasi Livin Mandiri\n2. Pilih Bayar\n3. Pilih Multi Payment\n4. Cari Topup Kilat\n5. Masukkan nomor VA',
      BRI_VA: '1. Buka aplikasi BRImo\n2. Pilih Transfer\n3. Pilih Virtual Account\n4. Masukkan nomor VA\n5. Konfirmasi pembayaran',
    };
    return instructions[method] || 'Ikuti instruksi pada aplikasi Anda';
  }
}
