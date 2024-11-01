import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(private configService: ConfigService) {}

  createPaymentUrl(amount: number, ipAddr: string): string {
    const vnp_TmnCode = this.configService.get<string>('VNP_TMNCODE');
    const vnp_HashSecret = this.configService.get<string>('VNP_HASHSECRET');
    const vnp_Url = this.configService.get<string>('VNP_URL');
    const vnp_ReturnUrl = this.configService.get<string>('VNP_RETURNURL');

    const date = new Date();
    const createDate = this.formatDate(date, 'yyyyMMddHHmmss');
    const orderId = `${date.getTime()}`;
    const vnpAmount = amount * 100;

    const vnp_Params: { [key: string]: string | number } = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode,
      vnp_Amount: vnpAmount,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Payment`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(vnp_Params[key] as string)}`)
      .join('&');

    console.log('Chuỗi đem vào hash:', sortedParams);
    console.log('SecretKey:', vnp_HashSecret);

    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(sortedParams).digest('hex');
    console.log('Chữ ký được tạo:', signed);

    const vnpUrl = `${vnp_Url}?${sortedParams}&vnp_SecureHash=${signed}`;
    console.log('URL thanh toán được tạo:', vnpUrl);
    return vnpUrl;
  }

  verifyCallback(query: any): { message: string; status: string } {
    const vnp_HashSecret = this.configService.get<string>('VNP_HASHSECRET');
    const vnpSecureHash = query.vnp_SecureHash;
    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedQuery = Object.keys(query)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(query[key] as string)}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(sortedQuery).digest('hex');
    console.log('Chuỗi ký callback:', sortedQuery);
    console.log('Chữ ký xác thực:', signed);

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

  private formatDate(date: Date, format: string): string {
    const yyyy = date.getFullYear().toString();
    const MM = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const HH = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return format
      .replace('yyyy', yyyy)
      .replace('MM', MM)
      .replace('dd', dd)
      .replace('HH', HH)
      .replace('mm', mm)
      .replace('ss', ss);
  }
}
