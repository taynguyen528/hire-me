// import {
//   Body,
//   Controller,
//   Get,
//   Post,
//   Query,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import { PaymentService } from './payment.service';
// import {
//   Public,
//   ResponseMessage,
//   SkipCheckPermission,
// } from 'src/decorator/customize';

// @Controller('payment')
// export class PaymentController {
//   constructor(private paymentService: PaymentService) {}

//   @SkipCheckPermission()
//   @ResponseMessage('Create payment')
//   @Post('create-payment')
//   createPayment(
//     @Body('amount') amount: number,
//     @Body('ipAddr') ipAddr: string,
//   ) {
//     try {
//       if (isNaN(amount) || amount <= 0) {
//         throw new Error('Số tiền phải là số hợp lệ lớn hơn 0');
//       }
//       const paymentUrl = this.paymentService.createPaymentUrl(amount, ipAddr);
//       return { url: paymentUrl };
//     } catch (error) {
//       console.error('Lỗi khi tạo URL thanh toán:', error);
//       throw new Error('Không thể tạo URL thanh toán');
//     }
//   }

//   @Public()
//   @Get('callback')
//   handleCallback(@Query() query) {
//     return this.paymentService.verifyCallback(query);
//   }
// }

import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  Public,
  ResponseMessage,
  SkipCheckPermission,
} from 'src/decorator/customize';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  /**
   * Tạo URL thanh toán và trả về Frontend
   */
  @SkipCheckPermission()
  @ResponseMessage('Create payment')
  @Post('create-payment')
  createPayment(
    @Body('amount') amount: number,
    @Body('ipAddr') ipAddr: string,
    @Req() req,
  ) {
    try {
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Số tiền phải là số hợp lệ lớn hơn 0');
      }

      const userId = req.user?._id;

      const paymentUrl = this.paymentService.createPaymentUrl(
        amount,
        ipAddr,
        userId,
      );

      return { url: paymentUrl };
    } catch (error) {
      console.error('Lỗi khi tạo URL thanh toán:', error);
      throw new Error('Không thể tạo URL thanh toán');
    }
  }

  @Public()
  @Get('callback')
  handleCallback(@Query() query) {
    try {
      const result = this.paymentService.verifyCallback(query);

      this.paymentService.saveTransactionResult(query, result);

      return result;
    } catch (error) {
      console.error('Lỗi khi xử lý callback:', error);
      throw new Error('Không thể xử lý callback từ VNPAY');
    }
  }

  @SkipCheckPermission()
  @ResponseMessage('Verify transaction status')
  @Get('verify')
  async verifyTransaction(
    @Query('txnRef') txnRef: string,
    @Query('vnp_Amount') vnp_Amount: string,
  ) {
    try {
      const transaction = await this.paymentService.getTransactionByOrderId(
        txnRef,
        vnp_Amount,
      );
      console.log('check transaction', transaction);

      if (!transaction) {
        return {
          status: 'failed',
          message: 'Không tìm thấy giao dịch',
        };
      }

      return {
        status: transaction.status,
        message:
          transaction.status === 'success'
            ? 'Giao dịch thành công!'
            : 'Giao dịch thất bại!',
        data: {
          txnRef,
          vnp_Amount,
        },
      };
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái giao dịch:', error);
      throw new Error('Không thể kiểm tra trạng thái giao dịch');
    }
  }
}
