/**
 * 파일 저장소 인터페이스
 *
 * 로컬 디스크, OCI Object Storage, S3 등 다양한 저장소 구현을 지원합니다.
 * 추상화를 통해 런타임에 저장소 구현을 교체할 수 있습니다.
 */
export interface StorageService {
  /**
   * 파일 업로드 (스트림 방식)
   *
   * 메모리에 파일을 로드하지 않고 스트림으로 처리합니다.
   *
   * @param file 업로드할 파일 정보
   * @returns 저장된 파일명 및 메타데이터
   */
  uploadFile(file: StorageFile): Promise<StoredFile>;

  /**
   * 파일 삭제
   *
   * 저장된 파일을 삭제합니다.
   *
   * @param fileName 삭제할 파일명
   */
  deleteFile(fileName: string): Promise<void>;

  /**
   * 파일 접근 URL 생성
   *
   * 저장된 파일에 접근 가능한 URL을 생성합니다.
   *
   * @param fileName 파일명
   * @returns 접근 가능한 URL
   */
  getFileUrl(fileName: string): string;
}

/**
 * 업로드할 파일 정보
 */
export interface StorageFile {
  /**
   * 원본 파일명
   */
  originalname: string;

  /**
   * MIME 타입
   */
  mimetype: string;

  /**
   * 파일 버퍼 (메모리에 로드된 전체 데이터)
   * 또는 스트림 (대용량 파일용)
   */
  buffer: Buffer;

  /**
   * 파일 크기 (바이트)
   */
  size: number;

  /**
   * 업로드할 때의 필드명
   */
  fieldname: string;
}

/**
 * 저장된 파일 정보
 */
export interface StoredFile {
  /**
   * 저장된 고유 파일명
   * 형식: {UUID}_{타임스탐프}{확장자}
   */
  filename: string;

  /**
   * 파일 접근 가능한 완성된 URL
   */
  url: string;

  /**
   * 원본 파일명
   */
  originalName: string;

  /**
   * MIME 타입
   */
  mimetype: string;

  /**
   * 저장된 파일 크기 (바이트)
   * 이미지는 최적화로 인해 원본보다 작을 수 있음
   */
  size: number;

  /**
   * 업로드 완료 시간
   */
  uploadedAt: Date;

  /**
   * 저장된 파일의 실제 경로 (로컬 디스크인 경우만 사용)
   */
  path?: string;
}
