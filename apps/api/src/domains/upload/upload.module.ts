import { Module } from '@nestjs/common';
import { UploadController } from './controllers/upload.controller';
import { UploadService } from './services/upload.service';
import { LocalStorageService } from './services/local-storage.service';

/**
 * Upload Module
 *
 * 최적화된 파일 업로드 기능을 제공합니다.
 *
 * 특징:
 * - StorageService 추상화를 통한 확장성
 * - LocalStorageService: 로컬 디스크 저장소
 * - 스트림 기반 파일 처리 (메모리 효율적)
 * - Sharp를 이용한 이미지 최적화 (WebP, 70%+ 용량 절감)
 * - 자동 정리 (업로드 실패 시 임시 파일 삭제)
 *
 * 환경 변수:
 * - STORAGE_PATH: 파일 저장 경로 (기본값: ./uploads)
 * - MEDIA_BASE_URL: 미디어 기본 URL (기본값: https://bluecollar.cv)
 *
 * Controllers: UploadController
 * Providers: UploadService, LocalStorageService
 *
 * 확장성:
 * 향후 OCI Object Storage로 교체하려면:
 * 1. OciStorageService를 구현 (StorageService 인터페이스)
 * 2. upload.module.ts의 providers에서 OciStorageService로 변경
 */
@Module({
  controllers: [UploadController],
  providers: [
    UploadService,
    // LocalStorageService를 기본 저장소로 제공
    // 향후 쉽게 OciStorageService로 교체 가능
    {
      provide: 'StorageService',
      useClass: LocalStorageService,
    },
  ],
  exports: [UploadService],
})
export class UploadModule {}
