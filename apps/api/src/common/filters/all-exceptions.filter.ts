import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PinoLogger } from 'nestjs-pino';
import { ErrorResponse } from '../types/error-response.interface';
import { ZodError } from 'zod';
import { SlackNotificationService } from '@/infrastructure/slack/services/slack-notification.service';

/**
 * 전역 예외 필터
 *
 * 모든 종류의 예외를 캐치하여 표준화된 응답 형식으로 반환합니다:
 * - HttpException: HTTP 상태 코드와 메시지 추출
 * - Zod ValidationError: 필드별 유효성 검사 에러로 포맷팅
 * - PostgreSQL Database Errors: 에러 코드 매핑
 * - Unknown Errors: 500 에러로 처리 (상세 정보는 서버에만 로깅)
 *
 * Slack 알림:
 * - 500+ 에러 및 DB 연결 실패 같은 치명적 에러만 Slack으로 알림
 * - 1분 내 동일 에러 반복 시 중복 알림 방지
 *
 * 로깅 전략:
 * - 4xx 에러: warn 레벨 (민감 정보 제거)
 * - 5xx 에러: error 레벨 (full stack trace) + Slack 알림
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: PinoLogger,
    @Optional()
    @Inject(SlackNotificationService)
    private readonly slackNotification?: SlackNotificationService,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(AllExceptionsFilter.name);
    }
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // 에러 응답 생성
    const errorResponse = this.buildErrorResponse(exception, request);

    // 에러 로깅
    this.logError(exception, request, errorResponse);

    // 치명적 에러인 경우 Slack 알림 (비동기, 응답을 막지 않음)
    if (this.slackNotification && errorResponse.statusCode >= 500) {
      this.slackNotification
        .notifyFatalError(
          errorResponse.statusCode,
          errorResponse.message,
          request.url,
          errorResponse.timestamp,
          request.method,
          request.ip,
        )
        .catch((err) => {
          // Slack 알림 실패는 로그만 남기고 무시
          this.logger.error(
            { error: (err as Error).message },
            '❌ Slack 알림 전송 중 에러',
          );
        });
    }

    // CORS 헤더 수동 추가 (Fastify reply 직접 전송 시 NestJS CORS 미들웨어 우회됨)
    const origin = (request.headers['origin'] as string) || '';
    const allowedOrigin =
      /(?:^|\.)bluecollar\.cv$/.test(origin) || /localhost:\d+$/.test(origin)
        ? origin
        : '';
    if (allowedOrigin) {
      response.header('Access-Control-Allow-Origin', allowedOrigin);
      response.header('Access-Control-Allow-Credentials', 'true');
    }

    // 클라이언트에 응답
    response.status(errorResponse.statusCode).send(errorResponse);
  }

  /**
   * 에러 응답 객체 생성
   */
  private buildErrorResponse(
    exception: unknown,
    request: FastifyRequest,
  ): ErrorResponse {
    // Zod 유효성 검사 에러
    if (exception instanceof ZodError) {
      const errors = (exception as any).errors || [];
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: errors.map((err: any) =>
          `${err.path.join('.')}: ${err.message}`.replace(/^: /, 'root: '),
        ),
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();

      // HttpException의 message는 string 또는 object
      let message: string | string[] = 'Internal Server Error';
      if (typeof responseBody === 'object' && responseBody !== null) {
        message = (responseBody as any).message || 'Error occurred';
      } else if (typeof responseBody === 'string') {
        message = responseBody;
      }

      return {
        statusCode: status,
        message,
        error: exception.name || this.getErrorName(status),
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // PostgreSQL 데이터베이스 에러
    if (this.isPostgresError(exception)) {
      return this.handlePostgresError(exception, request);
    }

    // 알 수 없는 에러 (500)
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : String(exception),
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  /**
   * PostgreSQL 에러 핸들링
   *
   * PostgreSQL 에러 코드 매핑:
   * - 23505: unique_violation → 409 Conflict
   * - 23503: foreign_key_violation → 400 Bad Request
   * - 23502: not_null_violation → 400 Bad Request
   * - 23514: check_violation → 400 Bad Request
   */
  private handlePostgresError(
    exception: any,
    request: FastifyRequest,
  ): ErrorResponse {
    const code = exception.code;

    // Unique constraint violation
    if (code === '23505') {
      const column =
        exception.detail?.match(/Key \("([^"]+)"\)/)?.[1] || 'field';
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `${column} already exists`,
        error: 'Conflict',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // Foreign key violation
    if (code === '23503') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Referenced resource does not exist',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // Not null violation
    if (code === '23502') {
      const column = exception.detail?.match(/Failing row/)?.[0] || 'field';
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `${column} is required`,
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // Check constraint violation
    if (code === '23514') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided',
        error: 'Bad Request',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // 기타 데이터베이스 에러 (500)
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        process.env.NODE_ENV === 'production'
          ? 'A database error occurred'
          : `Database error: ${code}`,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  /**
   * PostgreSQL 에러 여부 확인
   */
  private isPostgresError(exception: any): boolean {
    return (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof exception.code === 'string' &&
      exception.code.match(/^\d{5}$/) // PostgreSQL 에러 코드는 5자리 숫자
    );
  }

  /**
   * HTTP 상태 코드에 따른 에러명 반환
   */
  private getErrorName(status: number): string {
    const statusTexts: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };
    return statusTexts[status] || 'Error';
  }

  /**
   * 에러 로깅
   *
   * 4xx: warn 레벨 (클라이언트 에러)
   * 5xx: error 레벨 (서버 에러, full stack trace)
   */
  private logError(
    exception: unknown,
    request: FastifyRequest,
    errorResponse: ErrorResponse,
  ): void {
    const logContext = {
      statusCode: errorResponse.statusCode,
      message: errorResponse.message,
      path: request.url,
      method: request.method,
      ip: request.ip,
    };

    if (errorResponse.statusCode >= 400 && errorResponse.statusCode < 500) {
      // 4xx: 클라이언트 에러 - warn 레벨
      this.logger.warn(logContext, '클라이언트 요청 에러');
    } else {
      // 5xx: 서버 에러 - error 레벨 (전체 스택 트레이스)
      const errorMessage =
        exception instanceof Error
          ? `${exception.message}\n${exception.stack}`
          : String(exception);

      this.logger.error(
        { ...logContext, error: errorMessage },
        '서버 에러 발생',
      );
    }
  }
}
