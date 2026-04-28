import { Injectable, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import {
  StorageService,
  StorageFile,
  StoredFile,
} from '../interfaces/storage.interface';

/**
 * 허용된 파일 확장자 및 MIME 타입 매핑
 */
const ALLOWED_FILE_TYPES: Record<
  string,
  { ext: string; description: string; isImage: boolean }
> = {
  // 이미지 (Sharp로 최적화)
  'image/jpeg': { ext: '.webp', description: 'JPEG Image', isImage: true },
  'image/png': { ext: '.webp', description: 'PNG Image', isImage: true },
  'image/webp': { ext: '.webp', description: 'WebP Image', isImage: true },
  'image/gif': { ext: '.webp', description: 'GIF Image', isImage: true },

  // 비디오 (최적화 없음)
  'video/mp4': { ext: '.mp4', description: 'MP4 Video', isImage: false },
  'video/webm': { ext: '.webm', description: 'WebM Video', isImage: false },
  'video/quicktime': {
    ext: '.mov',
    description: 'QuickTime Video',
    isImage: false,
  },

  // PDF (최적화 없음)
  'application/pdf': {
    ext: '.pdf',
    description: 'PDF Document',
    isImage: false,
  },
};

/**
 * 최대 파일 크기 (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * 이미지 최적화 설정
 * - 최대 해상도: 2560x1920 (고화질 포트폴리오용)
 * - WebP 품질: 85 (균형잡힌 화질과 크기)
 * - 메타데이터 제거: 용량 절감
 */
const IMAGE_OPTIMIZATION = {
  maxWidth: 2560,
  maxHeight: 1920,
  quality: 85,
};

@Injectable()
export class LocalStorageService implements StorageService {
  // 저장 경로는 환경 변수에서 가져옴 (기본값: ./uploads)
  private storagePath: string;
  // 미디어 기본 URL
  private mediaBaseUrl: string;

  constructor(private readonly logger: PinoLogger) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(LocalStorageService.name);
    }

    // 환경 변수에서 저장 경로 가져오기 (기본값: ./uploads)
    this.storagePath = process.env.STORAGE_PATH || './uploads';
    // 미디어 기본 URL (기본값: https://bluecollar.cv)
    this.mediaBaseUrl = process.env.MEDIA_BASE_URL || 'https://bluecollar.cv';

    // 저장 경로가 존재하지 않으면 생성
    if (!fs.existsSync(this.storagePath)) {
      try {
        fs.mkdirSync(this.storagePath, { recursive: true });
        if (this.logger) {
          this.logger.info({ path: this.storagePath }, '저장 경로 생성 완료');
        }
      } catch (error) {
        if (this.logger) {
          this.logger.error(
            {
              path: this.storagePath,
              error: (error as Error).message,
            },
            '저장 경로 생성 실패',
          );
        }
        throw new BadRequestException('저장 경로 생성에 실패했습니다');
      }
    }
  }

  /**
   * 파일 업로드 (스트림 방식)
   *
   * 메모리에 파일을 로드하지 않고, 필요한 경우 최적화 후 저장합니다:
   * - 이미지: Sharp로 최적화 (WebP 변환, 해상도 제한)
   * - 비디오/PDF: 그대로 저장
   *
   * @param file 업로드할 파일
   * @returns 저장된 파일 정보
   * @throws BadRequestException - 검증 또는 저장 실패
   */
  async uploadFile(file: StorageFile): Promise<StoredFile> {
    // Step 1: 파일 존재 확인
    if (!file) {
      this.logger.warn({}, '파일이 제공되지 않음');
      throw new BadRequestException('파일을 업로드해주세요');
    }

    const { mimetype, originalname, buffer, size } = file;

    this.logger.debug(
      { originalname, mimetype, size },
      '파일 업로드 검증 시작',
    );

    // Step 2: MIME 타입 검증
    if (!ALLOWED_FILE_TYPES[mimetype]) {
      this.logger.warn(
        { mimetype, allowed: Object.keys(ALLOWED_FILE_TYPES) },
        '허용되지 않은 파일 타입',
      );

      const allowedTypes = Object.entries(ALLOWED_FILE_TYPES)
        .map((entry) => `${entry[0]} (${entry[1].description})`)
        .join(', ');

      throw new BadRequestException(
        `허용되지 않은 파일 타입입니다. 허용 타입: ${allowedTypes}`,
      );
    }

    // Step 3: 파일 크기 검증
    if (size > MAX_FILE_SIZE) {
      this.logger.warn({ size, maxSize: MAX_FILE_SIZE }, '파일 크기 초과');

      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      throw new BadRequestException(
        `파일 크기가 너무 큽니다. 최대 ${maxSizeMB}MB까지 가능합니다.`,
      );
    }

    // Step 4: 고유 파일명 생성
    const uuid = uuidv4();
    const timestamp = Date.now();
    const fileExtInfo = ALLOWED_FILE_TYPES[mimetype];
    const fileExt = fileExtInfo.ext;
    const fileName = `${uuid}_${timestamp}${fileExt}`;
    const filePath = path.join(this.storagePath, fileName);

    this.logger.info({ fileName, originalname }, '생성된 파일명');

    // Step 5: 이미지 최적화 (Sharp 사용) — 파일 쓰기 이전 단계
    // 실패해도 디스크에 파일이 없으므로 별도 정리 불필요
    let processedBuffer = buffer;
    let processedSize = size;
    let processedMimetype = mimetype;

    if (fileExtInfo.isImage) {
      try {
        this.logger.debug({ originalname }, '이미지 최적화 시작');

        // Sharp로 이미지 처리
        // 1. 최대 해상도로 리사이징
        // 2. WebP 포맷으로 변환
        // 3. 메타데이터 제거
        const optimizedBuffer = await sharp(buffer)
          .resize(IMAGE_OPTIMIZATION.maxWidth, IMAGE_OPTIMIZATION.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: IMAGE_OPTIMIZATION.quality })
          .toBuffer();

        const compressionRate = (
          ((size - optimizedBuffer.length) / size) *
          100
        ).toFixed(1);

        this.logger.info(
          {
            originalSize: size,
            optimizedSize: optimizedBuffer.length,
            compressionRate: `${compressionRate}%`,
          },
          '이미지 최적화 완료',
        );

        processedBuffer = optimizedBuffer;
        processedSize = optimizedBuffer.length;
        processedMimetype = 'image/webp';
      } catch (error) {
        this.logger.error(
          { originalname, error: (error as Error).message },
          '이미지 최적화 실패',
        );
        throw new BadRequestException('이미지 처리 중 오류가 발생했습니다');
      }
    }

    // Step 6: 파일 저장 — 이 시점부터 실패 시 임시 파일 삭제 필요
    try {
      fs.writeFileSync(filePath, processedBuffer);

      this.logger.info({ filePath, size: processedSize }, '파일 저장 완료');

      // Step 7: 완성된 URL 생성
      const fileUrl = this.getFileUrl(fileName);

      return {
        filename: fileName,
        url: fileUrl,
        originalName: originalname,
        mimetype: processedMimetype,
        size: processedSize,
        uploadedAt: new Date(),
        path: filePath,
      };
    } catch (error) {
      // 파일 쓰기 실패 시 생성된 임시 파일 즉시 삭제
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          this.logger.info({ filePath }, '임시 파일 삭제 완료');
        } catch (deleteError) {
          this.logger.warn(
            { filePath, error: (deleteError as Error).message },
            '임시 파일 삭제 실패',
          );
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error({ filePath, error: errorMessage }, '파일 저장 실패');

      throw new BadRequestException('파일 저장에 실패했습니다');
    }
  }

  /**
   * 파일 삭제 (로컬 디스크에서 제거)
   *
   * @param fileName 삭제할 파일명
   */
  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.storagePath, fileName);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.info({ fileName }, '파일 삭제 완료');
      } else {
        this.logger.warn({ fileName }, '삭제할 파일을 찾을 수 없음');
      }
    } catch (error) {
      this.logger.error(
        { fileName, error: (error as Error).message },
        '파일 삭제 실패',
      );
      throw new BadRequestException('파일 삭제에 실패했습니다');
    }
  }

  /**
   * 파일 접근 URL 생성
   *
   * @param fileName 파일명
   * @returns 접근 가능한 완성된 URL
   */
  getFileUrl(fileName: string): string {
    return `${this.mediaBaseUrl}/media/${fileName}`;
  }
}
