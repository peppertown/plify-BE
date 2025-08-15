import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 에러 추적을 위한 고유 ID 생성
    const errorId = this.generateErrorId();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 오류가 발생했습니다.';
    let code = 'INTERNAL_SERVER_ERROR';

    // HttpException 처리 (NestJS 기본 예외)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse['message']
      ) {
        message = exceptionResponse['message'];
      }
      code = this.getErrorCode(status);
    }
    // Prisma 에러 처리
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      code = prismaError.code;
    }
    // 알 수 없는 에러
    else if (exception instanceof Error) {
      // 개발환경에서는 상세한 에러 메시지, 프로덕션에서는 일반적인 메시지
      const isDevelopment = process.env.NODE_ENV === 'development';
      message = isDevelopment
        ? `[${errorId}] ${exception.message}`
        : `서버 오류가 발생했습니다. (Error ID: ${errorId})`;

      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    }

    // 상세한 에러 로깅
    const errorDetails = {
      method: request.method,
      url: request.url,
      statusCode: status,
      message,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      body: request.body,
      params: request.params,
      query: request.query,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `[ERROR_ID: ${errorId}] [${errorDetails.method}] ${errorDetails.url} - ${status} - ${message}`,
      {
        errorId,
        ...errorDetails,
        stack: exception instanceof Error ? exception.stack : undefined,
        originalError: exception,
      },
    );

    // FLIP 프로젝트의 응답 형식에 맞춘 에러 응답
    const errorResponse = {
      message: {
        code: status,
        text: message,
      },
      error: {
        errorId,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: '이미 존재하는 데이터입니다.',
          code: 'DUPLICATE_ENTRY',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: '요청한 데이터를 찾을 수 없습니다.',
          code: 'NOT_FOUND',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: '관련된 데이터가 존재하지 않습니다.',
          code: 'FOREIGN_KEY_CONSTRAINT',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '데이터베이스 오류가 발생했습니다.',
          code: 'DATABASE_ERROR',
        };
    }
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}