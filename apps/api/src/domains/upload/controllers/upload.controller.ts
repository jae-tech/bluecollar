import {
  Controller,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { FastifyRequest } from 'fastify';
import { Readable } from 'stream';
import { UploadService } from '../services/upload.service';
import { UploadFileResponseDto } from '../dtos/upload-file.dto';

/**
 * Upload Controller
 *
 * 로컬 디스크 기반 파일 업로드 API를 제공합니다.
 * - 이미지, 비디오, PDF 업로드 지원
 * - UUID + 타임스탐프 기반 파일명 생성
 * - 완성된 URL 반환 (Nginx를 통해 서빙 가능)
 *
 * Fastify 멀티파트 폼 데이터를 처리합니다.
 */
@Controller('media')
@ApiTags('Media')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(UploadController.name);
    }
  }

  /**
   * 파일 업로드 (Fastify 멀티파트 처리)
   *
   * 이미지, 비디오, PDF 파일을 로컬 디스크에 업로드합니다.
   * 업로드 완료 후 Nginx를 통해 접근 가능한 완성된 URL을 반환합니다.
   *
   * 지원 파일:
   * - 이미지: JPEG, PNG, WebP, GIF
   * - 비디오: MP4, WebM, QuickTime
   * - 문서: PDF
   *
   * 최대 파일 크기: 50MB
   *
   * @param request Fastify 요청 객체 (멀티파트 데이터 포함)
   * @returns 업로드된 파일 정보 (filename, url, size 등)
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '파일 업로드',
    description:
      'Multipart form-data를 통해 파일을 업로드합니다. 완성된 URL이 반환되어 포트폴리오 저장 시 사용할 수 있습니다.',
  })
  @ApiResponse({
    status: 201,
    description: '파일 업로드 성공',
    schema: {
      example: {
        filename: '8f3a4d2c-1234-5678-abcd-ef1234567890_1704067200000.jpg',
        url: 'https://bluecollar.cv/media/8f3a4d2c-1234-5678-abcd-ef1234567890_1704067200000.jpg',
        originalName: 'before-photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        uploadedAt: '2024-01-01T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '파일 검증 실패 (파일 없음, 허용되지 않은 타입, 크기 초과)',
  })
  async uploadFile(
    @Req() request: FastifyRequest,
  ): Promise<UploadFileResponseDto> {
    try {
      // @fastify/multipart 플러그인으로 등록된 parts() 메서드 사용
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts = (request as any).parts();

      // 첫 번째 파일 부분을 찾음
      for await (const part of parts) {
        // 파일 타입 부분만 처리
        if (part.type === 'file') {
          // Buffer로 변환
          const buffer = await part.toBuffer();

          // Multer 호환 파일 객체 생성
          const file: Express.Multer.File = {
            fieldname: part.fieldname,
            originalname: part.filename,
            encoding: part.encoding,
            mimetype: part.mimetype,
            size: buffer.length,
            destination: '',
            filename: part.filename,
            path: '',
            buffer: buffer,
            stream: Readable.from([buffer]),
          };

          this.logger.info(
            { originalName: file.originalname, size: file.size },
            '파일 업로드 요청 수신',
          );

          // UploadService에서 검증 및 저장
          return await this.uploadService.uploadFile(file);
        }
      }

      // 파일이 제공되지 않음
      this.logger.warn({}, '파일이 제공되지 않음');
      throw new BadRequestException('파일을 업로드해주세요');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error({ error: errorMessage }, '파일 업로드 처리 실패');

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('파일 업로드 처리 중 오류가 발생했습니다');
    }
  }

  /**
   * 파일 삭제
   *
   * 로컬 디스크에서 업로드된 파일을 삭제합니다.
   * 포트폴리오 삭제 또는 미디어 교체 시 사용합니다.
   *
   * @param filename 삭제할 파일명 (업로드 시 반환된 filename)
   */
  @Delete(':filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '파일 삭제',
    description:
      '업로드된 파일을 로컬 디스크에서 삭제합니다. 업로드 시 반환된 filename을 사용합니다.',
  })
  @ApiResponse({ status: 204, description: '파일 삭제 성공' })
  @ApiResponse({ status: 400, description: '파일 삭제 실패' })
  async deleteFile(@Param('filename') filename: string): Promise<void> {
    this.logger.info({ filename }, '파일 삭제 요청 수신');
    await this.uploadService.deleteFile(filename);
  }
}
