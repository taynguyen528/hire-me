import { Controller, Get, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Public, ResponseMessage } from 'src/decorator/customize';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Public()
  @ResponseMessage('Create payment')
  @Get('create-payment')
  createPayment(
    @Query('amount') amount: number,
    @Query('ipAddr') ipAddr: string,
  ) {
    try {
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Amount must be a valid number greater than 0');
      }
      const paymentUrl = this.paymentService.createPaymentUrl(amount, ipAddr);
      return { url: paymentUrl };
    } catch (error) {
      console.error('Lỗi khi tạo URL thanh toán:', error);
      throw new Error('Không thể tạo URL thanh toán');
    }
  }

  @Public()
  @Get('callback')
  handleCallback(@Query() query) {
    return this.paymentService.verifyCallback(query);
  }
}
