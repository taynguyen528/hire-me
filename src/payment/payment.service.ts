import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'qs';

@Injectable()
export class PaymentService {
  constructor(private configService: ConfigService) {}

  createPaymentUrl(amount: number, ipAddr: string): string {
    const vnp_TmnCode = this.configService.get<string>('VNP_TMNCODE');
    const vnp_HashSecret = this.configService.get<string>('VNP_HASHSECRET');
    const vnp_Url = this.configService.get<string>('VNP_URL');
    const vnp_ReturnUrl = this.configService.get<string>('VNP_RETURNURL');

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const orderId = `${date.getTime()}`;
    const vnpAmount = amount * 100;

    // Tạo đối tượng tham số VNPay
    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode,
      vnp_Amount: vnpAmount,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: 'Payment', // Không mã hóa ở đây
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sắp xếp tham số theo thứ tự bảng chữ cái
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    // Ký dữ liệu
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(signData).digest('hex');

    // Gắn chữ ký vào tham số
    sortedParams['vnp_SecureHash'] = signed;

    // Tạo URL thanh toán
    const vnpUrl = `${vnp_Url}?${qs.stringify(sortedParams, {
      encode: false,
    })}`;
    return vnpUrl;
  }

  verifyCallback(query: any): { message: string; status: string } {
    const vnp_HashSecret = this.configService.get<string>('VNP_HASHSECRET');
    const vnpSecureHash = query.vnp_SecureHash;
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedQuery = Object.keys(query)
      .sort()
      .reduce((acc, key) => {
        acc[key] = query[key];
        return acc;
      }, {});

    const signData = qs.stringify(sortedQuery, { encode: false });
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(signData).digest('hex');

    if (signed === vnpSecureHash) {
      if (query.vnp_ResponseCode === '00') {
        return { message: 'Giao dịch thành công!', status: 'success' };
      } else {
        return { message: 'Giao dịch thất bại!', status: 'failed' };
      }
    } else {
      return { message: 'Xác thực không thành công!', status: 'invalid' };
    }
  }
}
