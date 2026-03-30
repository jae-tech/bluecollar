# 포트폴리오 시스템 통합 가이드

## 개요

BlueCollar 포트폴리오 시스템은 2단계로 구성됩니다:

1. **파일 업로드 단계** (POST /media/upload)
2. **포트폴리오 저장 단계** (POST /portfolios)

---

## 1️⃣ 파일 업로드 (POST /media/upload)

### 목적
이미지, 비디오, PDF 파일을 로컬 디스크에 저장하고 접근 가능한 URL을 받아옵니다.

### 요청

**엔드포인트**: `POST /media/upload`

**Content-Type**: `multipart/form-data`

**필드명**: `file`

### 지원 파일 타입

| 타입 | MIME Type | 확장자 | 설명 |
|------|-----------|--------|------|
| 이미지 | `image/jpeg` | `.jpg` | JPEG 이미지 |
| 이미지 | `image/png` | `.png` | PNG 이미지 |
| 이미지 | `image/webp` | `.webp` | WebP 이미지 |
| 이미지 | `image/gif` | `.gif` | GIF 이미지 |
| 비디오 | `video/mp4` | `.mp4` | MP4 비디오 |
| 비디오 | `video/webm` | `.webm` | WebM 비디오 |
| 비디오 | `video/quicktime` | `.mov` | QuickTime 비디오 |
| 문서 | `application/pdf` | `.pdf` | PDF 문서 |

**최대 파일 크기**: 50MB

### 응답 예시

```bash
curl -X POST http://localhost:4000/media/upload \
  -F "file=@before-photo.jpg"
```

**응답 (201 Created)**:

```json
{
  "filename": "8f3a4d2c-1234-5678-abcd-ef1234567890_1704067200000.jpg",
  "url": "https://bluecollar.cv/media/8f3a4d2c-1234-5678-abcd-ef1234567890_1704067200000.jpg",
  "originalName": "before-photo.jpg",
  "mimetype": "image/jpeg",
  "size": 1024000,
  "uploadedAt": "2024-01-01T12:00:00.000Z"
}
```

### 파일명 생성 규칙

**형식**: `{UUID}_{타임스탐프}{확장자}`

- **UUID**: 고유성 보장 (v4 UUID)
- **타임스탐프**: 시간순 정렬 가능 (Unix milliseconds)
- **확장자**: MIME 타입에 따라 자동 결정

**예시**:
- `8f3a4d2c-1234-5678-abcd-ef1234567890_1704067200000.jpg`
- `a1b2c3d4-5678-90ab-cdef-1234567890ab_1704067300000.mp4`

---

## 2️⃣ 포트폴리오 저장 (POST /portfolios)

### 목적
포트폴리오 정보와 업로드된 미디어 URL을 함께 저장합니다.

### 1단계: 파일 업로드

각 미디어 파일마다 `POST /media/upload`을 호출하여 URL을 획득합니다.

```javascript
// 예시: JavaScript/TypeScript
const formData = new FormData();
formData.append('file', imageFile); // File 객체

const uploadResponse = await fetch('https://bluecollar.cv/api/media/upload', {
  method: 'POST',
  body: formData,
});

const uploadedMedia = await uploadResponse.json();
console.log('업로드된 미디어 URL:', uploadedMedia.url);
```

### 2단계: 포트폴리오 생성

업로드된 URL들을 이용하여 포트폴리오를 생성합니다.

```javascript
// 예시: 포트폴리오 생성 요청
const portfolioData = {
  workerProfileId: 'uuid-of-worker',
  title: '강남 아파트 타일 공사',
  content: '32평 아파트의 욕실 및 주방 타일 공사를 진행했습니다.',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  difficulty: 'MEDIUM',
  estimatedCost: 5000000,
  actualCost: 4800000,
  costVisibility: 'PRIVATE',
  media: [
    {
      mediaUrl: 'https://bluecollar.cv/media/uuid_timestamp1.jpg', // 업로드된 URL
      mediaType: 'IMAGE',
      imageType: 'BEFORE',
      description: '시공 전 사진',
    },
    {
      mediaUrl: 'https://bluecollar.cv/media/uuid_timestamp2.jpg', // 업로드된 URL
      mediaType: 'IMAGE',
      imageType: 'AFTER',
      description: '시공 후 사진',
    },
  ],
};

const portfolioResponse = await fetch('https://bluecollar.cv/api/portfolios', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {token}',
  },
  body: JSON.stringify(portfolioData),
});

const portfolio = await portfolioResponse.json();
console.log('생성된 포트폴리오:', portfolio);
```

---

## 📁 환경 변수 설정

### .env 파일 설정

```env
# 파일 저장 경로 (기본값: ./uploads)
STORAGE_PATH=/var/www/bluecollar/uploads

# 미디어 기본 URL (기본값: https://bluecollar.cv)
MEDIA_BASE_URL=https://bluecollar.cv
```

---

## 🚀 Nginx 설정 (파일 서빙)

### Nginx 설정 예시

```nginx
server {
    listen 443 ssl http2;
    server_name bluecollar.cv;

    # SSL 설정
    ssl_certificate /etc/ssl/certs/bluecollar.crt;
    ssl_certificate_key /etc/ssl/private/bluecollar.key;

    # API 요청 프록시
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 미디어 파일 서빙 (로컬 디스크)
    location /media/ {
        alias /var/www/bluecollar/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 공개 프로필 서빙
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 파일 권한 설정

```bash
# uploads 폴더 생성
mkdir -p /var/www/bluecollar/uploads

# 권한 설정 (Nginx 사용자)
chown -R www-data:www-data /var/www/bluecollar/uploads
chmod -R 755 /var/www/bluecollar/uploads
```

---

## 🔄 전체 워크플로우 (클라이언트 관점)

```
┌─────────────────────────────────────────────────┐
│ 클라이언트: 포트폴리오 작성 폼                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 1️⃣ 파일 선택 & 업로드 (POST /media/upload)     │
│    - 이미지 파일들 선택                          │
│    - 각 파일마다 업로드 요청                     │
│    - 완성된 URL 획득                            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 2️⃣ 포트폴리오 정보 입력                         │
│    - 제목, 설명, 시공 기간 등                   │
│    - 업로드된 미디어 URL 자동 입력              │
│    - 난이도, 예상 비용, 공개 여부 선택          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 3️⃣ 포트폴리오 저장 (POST /portfolios)          │
│    - 모든 정보 및 미디어 URL 함께 전송          │
│    - 데이터베이스에 저장                        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ ✅ 포트폴리오 완성                              │
│    - slug.bluecollar.cv에서 공개 조회           │
│    - 이미지는 https://bluecollar.cv/media/...   │
└─────────────────────────────────────────────────┘
```

---

## 🛡️ 보안 고려사항

### 1. 확장자 필터링
✅ **구현됨**: MIME 타입 검증으로 허용된 파일만 업로드 가능

### 2. 파일명 중복 방지
✅ **구현됨**: UUID + 타임스탐프 조합으로 고유성 보장

### 3. 파일 크기 제한
✅ **구현됨**: 최대 50MB 제한

### 4. 디렉토리 트래버설 공격 방지
✅ **구현됨**: 파일명 자동 생성으로 경로 조작 불가능

### 5. 바이러스 스캔 (선택사항)
향후 ClamAV 등의 안티바이러스 통합 가능

---

## 📊 API 응답 코드

| 상태코드 | 의미 | 설명 |
|---------|------|------|
| `201` | Created | 파일 업로드 성공 |
| `400` | Bad Request | 파일 검증 실패 (타입, 크기) |
| `500` | Internal Server Error | 서버 오류 |

---

## 🔗 관련 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/media/upload` | 파일 업로드 |
| `POST` | `/portfolios` | 포트폴리오 생성 |
| `GET` | `/portfolios/:id` | 포트폴리오 상세 조회 |
| `GET` | `/public/profiles/:slug` | 공개 프로필 조회 (포트폴리오 포함) |

---

## 💡 팁과 주의사항

### 1. 대량 이미지 업로드
여러 이미지를 한 번에 업로드할 때는 병렬 요청으로 속도를 높일 수 있습니다:

```javascript
const uploadPromises = imageFiles.map(file => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch('/media/upload', { method: 'POST', body: formData });
});

const results = await Promise.all(uploadPromises);
const mediaUrls = await Promise.all(results.map(r => r.json()));
```

### 2. 조회수 자동 증가
공개 프로필 조회 시 포트폴리오의 `viewCount`가 자동으로 증가합니다:

```javascript
// GET /public/profiles/kim-tile-expert 조회 시
// 응답의 portfolios[].viewCount가 증가
```

### 3. 미디어 타입별 최적화
- **이미지**: 500-2000px 해상도 권장
- **비디오**: 720p 이상, 30초 이상 권장
- **PDF**: 5MB 이상 권장 안함

---

## 🐛 트러블슈팅

### Q: "허용되지 않은 파일 타입입니다" 에러

**원인**: 지원하지 않는 MIME 타입

**해결책**:
1. 파일을 지원되는 형식으로 변환 (예: WebP를 PNG로)
2. Swagger 문서에서 지원 타입 확인

### Q: "파일 크기가 너무 큽니다" 에러

**원인**: 50MB 초과

**해결책**:
1. 이미지 압축 (TinyPNG, ImageOptim 등)
2. 비디오 해상도 낮추기

### Q: 업로드된 파일이 접근 불가능

**원인**: Nginx 설정 오류 또는 파일 권한 문제

**해결책**:
1. Nginx `/media` 위치 설정 확인
2. 파일 소유권 및 권한 확인 (755 이상)
3. Nginx 재시작: `sudo systemctl restart nginx`

---

## 📈 향후 개선사항

- [ ] 이미지 자동 리사이징
- [ ] 비디오 트랜스코딩
- [ ] CDN 통합
- [ ] 바이러스 스캔
- [ ] 사용자별 용량 제한
- [ ] 파일 삭제 API

---

**생성일**: 2024-01-01
**마지막 수정**: 2024-01-01
