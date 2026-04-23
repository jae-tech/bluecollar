import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { PinoLogger } from 'nestjs-pino';
import { Public } from '@/common/decorators/public.decorator';
import { UnsubscribeDto, UnsubscribeSchema } from '../dtos/unsubscribe.dto';

/**
 * Email Controller
 *
 * 이메일 관련 공개 API:
 * - POST /email/unsubscribe: 마케팅 이메일 수신 거부
 */
@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly logger: PinoLogger) {
    if (this.logger && typeof this.logger.setContext === 'function') {
      this.logger.setContext(EmailController.name);
    }
  }

  /**
   * 마케팅 이메일 수신 거부
   *
   * 사용자가 이메일 푸터의 수신 거부 링크를 클릭하면 호출됩니다.
   * 현재는 로그 기록만 수행하며, 향후 DB 컬럼 추가 시 상태를 저장합니다.
   *
   * @param dto 수신 거부할 이메일 주소
   */
  @Public()
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '마케팅 이메일 수신 거부',
    description: '해당 이메일 주소의 마케팅 이메일 수신을 거부합니다.',
  })
  @ApiOkResponse({
    description: '수신 거부 처리 완료',
    schema: {
      example: { message: '수신 거부가 완료되었습니다.' },
    },
  })
  unsubscribe(
    @Body(new ZodValidationPipe(UnsubscribeSchema)) dto: UnsubscribeDto,
  ) {
    this.logger.info({ email: dto.email }, '마케팅 이메일 수신 거부 요청');

    return { message: '수신 거부가 완료되었습니다.' };
  }
}
