import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionFilter');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exceptionResponse as string;
      }
      code = exception.name;
    } else if (exception instanceof Error) {
      // Log detailed error but don't expose to client
      this.logger.error('Unhandled exception:', exception.message, exception.stack);
      message = 'An unexpected error occurred';
    }

    // Do NOT expose sensitive information in response
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      message: message,
      code: code,
      // Don't include stack trace or detailed error info in production
      ...(process.env.NODE_ENV !== 'production' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
