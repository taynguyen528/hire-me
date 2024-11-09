import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { error } from 'console';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    console.log('Exception Response:', exceptionResponse);

    response.status(status).json({
      statusCode: status,
      error: exceptionResponse['error'] || 'Http Exception',
      message: exceptionResponse['message'] || 'An error occurred',
    });
  }
}
