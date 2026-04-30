import { Module } from '@nestjs/common';
import { WorkScheduleController } from './controllers/work-schedule.controller';
import { WorkScheduleService } from './services/work-schedule.service';
import { DrizzleModule } from '@/infrastructure/database/drizzle.module';

/**
 * WorkScheduleModule
 *
 * 워커 작업 일정 CRUD 기능을 제공합니다.
 * 이름: WorkScheduleModule (app.module.ts의 @nestjs/schedule ScheduleModule과 충돌 방지)
 *
 * Imports: DrizzleModule (데이터베이스 접근)
 * Controllers: WorkScheduleController
 * Providers: WorkScheduleService
 */
@Module({
  imports: [DrizzleModule],
  controllers: [WorkScheduleController],
  providers: [WorkScheduleService],
  exports: [WorkScheduleService],
})
export class WorkScheduleModule {}
