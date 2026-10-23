import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsISO8601, IsInt, IsOptional, IsString, Length, Matches } from 'class-validator';

export const LEVELS = ['Junior', 'Mid-level', 'Senior'];

export class CreateBookingDto {
  @IsString() @Matches(/^[a-z0-9-]{2,40}$/) subject: string;
  @IsString() @Length(2, 80) candidateRole: string;
  @IsIn(LEVELS) level: string;
  @IsOptional() @IsISO8601() scheduledAt?: string;
  @Type(() => Number) @IsInt() @IsIn([15, 20, 30, 45]) durationMin: number;
  @IsOptional() @IsBoolean() instant?: boolean;
}

export class RescheduleDto {
  @IsISO8601() scheduledAt: string;
}
