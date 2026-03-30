import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { StorageService } from '../interfaces/storage.interface';
import { UploadFileResponseDto } from '../dtos/upload-file.dto';

/**
 * Upload Service
 *
 * 파일 업로드를 관리하는 서비스입니다.
 * StorageService 인터페이스를 사용하여 저장소 구현에 독립적입니다.
 *
 * 특징:
 * - 스트림 기반 파일 저장 (메모리 효율적)
 * - 이미지 자동 최적화 (Sharp로 WebP 변환)
 * - 용량 70% 이상 절감
 * - 예외 처리 및 자동 정리
 */
@Injectable()
export class UploadService {
  constructor(
    @Inject('StorageService')
    private readonly storageService: StorageService,
    private readonly logger: PinoLogger,
  ) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(UploadService.name);
    }
  }

  /**
   * 파일 업로드 처리
   *
   * StorageService를 통해 파일을 저장합니다:
   * - 검증 (MIME 타입, 크기)
   * - 최적화 (이미지는 WebP로 변환)
   * - 저장 (고유 파일명)
   * - URL 생성
   *
   * @param file 업로드할 파일
   * @returns 업로드 결과 (파일명, URL, 크기 등)
   * @throws BadRequestException - 파일 검증 또는 저장 실패
   */
  async uploadFile(file: Express.Multer.File): Promise<UploadFileResponseDto> {
    this.logger.info(
      { originalName: file.originalname, size: file.size },
      '파일 업로드 처리 시작',
    );

    // StorageService에서 검증, 최적화, 저장 처리
    const storedFile = await this.storageService.uploadFile({
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
      fieldname: file.fieldname,
    });

    this.logger.info(
      { filename: storedFile.filename, url: storedFile.url },
      '파일 업로드 완료',
    );

    return {
      filename: storedFile.filename,
      url: storedFile.url,
      originalName: storedFile.originalName,
      mimetype: storedFile.mimetype,
      size: storedFile.size,
      uploadedAt: storedFile.uploadedAt,
    };
  }

  /**
   * 파일 삭제
   *
   * StorageService를 통해 저장된 파일을 삭제합니다.
   *
   * @param fileName 삭제할 파일명
   */
  async deleteFile(fileName: string): Promise<void> {
    this.logger.debug({ fileName }, '파일 삭제 처리 시작');
    await this.storageService.deleteFile(fileName);
    this.logger.info({ fileName }, '파일 삭제 완료');
  }
}
