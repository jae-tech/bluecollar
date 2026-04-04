import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PinoLogger } from 'nestjs-pino';

// vi.mock은 호이스팅되므로 factory 안에서 외부 변수 참조 불가
// 대신 vi.hoisted()로 mock 함수를 미리 선언

const { mockReadFileSync, mockSendMail, mockVerify } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(() => '<html>{{body}}</html>'),
  mockSendMail: vi.fn(),
  mockVerify: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mockSendMail, verify: mockVerify })),
  },
  createTransport: vi.fn(() => ({ sendMail: mockSendMail, verify: mockVerify })),
}));

vi.mock('fs', () => ({
  default: { readFileSync: mockReadFileSync },
  readFileSync: mockReadFileSync,
}));

vi.mock('handlebars', () => {
  const compileFn = vi.fn((_tpl: string) => (data: any) => `<html>${JSON.stringify(data)}</html>`);
  return {
    default: { compile: compileFn },
    compile: compileFn,
  };
});

import { NodemailerEmailService } from './nodemailer-email.service';

const mockLogger = {
  setContext: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
} as unknown as PinoLogger;

vi.stubEnv('EMAIL_HOST', 'smtp.zoho.com');
vi.stubEnv('EMAIL_PORT', '587');
vi.stubEnv('EMAIL_USER', 'hello@bluecollar.cv');
vi.stubEnv('EMAIL_PASSWORD', 'test-password');
vi.stubEnv('EMAIL_FROM', 'hello@bluecollar.cv');
vi.stubEnv('EMAIL_REPLY_TO', 'support@bluecollar.cv');

describe('NodemailerEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFileSync.mockReturnValue('<html>{{body}}</html>');
  });

  describe('초기화', () => {
    it('템플릿 로드 성공 시 정상 생성됨', () => {
      expect(() => new NodemailerEmailService(mockLogger)).not.toThrow();
    });

    it('템플릿 파일 없으면 앱 시작 시 throw', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => new NodemailerEmailService(mockLogger)).toThrow(
        '이메일 템플릿 로드 실패',
      );
    });
  });

  describe('sendVerificationEmail', () => {
    let service: NodemailerEmailService;

    beforeEach(() => {
      service = new NodemailerEmailService(mockLogger);
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
    });

    it('SIGNUP 타입 — 회원가입 subject로 sendMail 호출', async () => {
      await service.sendVerificationEmail('user@test.com', '123456', 'SIGNUP');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('회원가입'),
        }),
      );
    });

    it('PASSWORD_RESET 타입 — 비밀번호 재설정 subject로 sendMail 호출', async () => {
      await service.sendVerificationEmail('user@test.com', '654321', 'PASSWORD_RESET');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('비밀번호'),
        }),
      );
    });

    it('EMAIL_CHANGE 타입 — 이메일 변경 subject로 sendMail 호출', async () => {
      await service.sendVerificationEmail('user@test.com', '111222', 'EMAIL_CHANGE');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('이메일 변경'),
        }),
      );
    });

    it('SMTP 실패 시 에러를 throw하고 에러 로그를 남김', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP 연결 실패'));

      await expect(
        service.sendVerificationEmail('user@test.com', '123456', 'SIGNUP'),
      ).rejects.toThrow('SMTP 연결 실패');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail', () => {
    let service: NodemailerEmailService;

    beforeEach(() => {
      service = new NodemailerEmailService(mockLogger);
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
    });

    it('비밀번호 재설정 이메일 발송', async () => {
      await service.sendPasswordResetEmail('user@test.com', 'https://app.com/reset?token=abc');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('비밀번호 재설정'),
        }),
      );
    });

    it('SMTP 실패 시 에러를 throw함', async () => {
      mockSendMail.mockRejectedValue(new Error('연결 거부'));

      await expect(
        service.sendPasswordResetEmail('user@test.com', 'https://app.com/reset'),
      ).rejects.toThrow('연결 거부');
    });
  });

  describe('isHealthy', () => {
    let service: NodemailerEmailService;

    beforeEach(() => {
      service = new NodemailerEmailService(mockLogger);
    });

    it('SMTP verify 성공 시 true 반환', async () => {
      mockVerify.mockResolvedValue(true);

      const result = await service.isHealthy();
      expect(result).toBe(true);
    });

    it('SMTP verify 실패 시 false 반환 (throw 아님)', async () => {
      mockVerify.mockRejectedValue(new Error('연결 실패'));

      const result = await service.isHealthy();
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
