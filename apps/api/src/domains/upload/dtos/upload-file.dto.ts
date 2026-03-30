/**
 * 파일 업로드 요청 DTO
 *
 * Multer의 Express.Multer.File 객체를 래핑합니다.
 * 파일 객체는 미들웨어에서 자동으로 주입됩니다.
 */
export class UploadFileDto {
  // Multer에서 자동으로 제공되는 파일 객체
  // @Body()로 받지 않고, @UploadedFile() 데코레이터로 받습니다
}

/**
 * 파일 업로드 응답 DTO
 *
 * 업로드 완료 후 반환할 파일 정보
 */
export class UploadFileResponseDto {
  /**
   * 저장된 파일의 고유 파일명 (UUID + 타임스탐프 조합)
   */
  filename!: string;

  /**
   * 공개 접근 가능한 완성된 URL
   * 예: https://bluecollar.cv/media/8f3a4d2c_1704067200000.jpg
   */
  url!: string;

  /**
   * 원본 파일명
   */
  originalName!: string;

  /**
   * 파일 MIME 타입
   * 예: image/jpeg, video/mp4, application/pdf
   */
  mimetype!: string;

  /**
   * 파일 크기 (바이트)
   */
  size!: number;

  /**
   * 업로드 완료 시간
   */
  uploadedAt!: Date;
}
