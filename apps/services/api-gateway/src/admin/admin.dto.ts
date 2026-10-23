import { Type } from 'class-transformer';
import { IsHexColor, IsIn, IsInt, IsMongoId, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsIn(['user', 'admin']) role?: string;
  @IsOptional() @IsIn(['active', 'suspended']) status?: string;
}

export class TopicDto {
  @IsOptional() @IsString() @MaxLength(60) subjectSlug?: string;
  @IsString() @Length(2, 120) title: string;
  @IsOptional() @IsString() @MaxLength(300) summary?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(90) minutes: number;
  @IsString() @Length(1, 60) section: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(500) order?: number;
  @IsString() @Length(1, 60_000) markdown: string;
}

export class QuestionDto {
  @IsOptional() @IsMongoId() topicId?: string;
  @IsIn(['beginner', 'intermediate', 'senior']) difficulty: string;
  @IsString() @Length(5, 500) question: string;
  @IsString() @Length(5, 6000) answer: string;
  @IsOptional() @IsString() @MaxLength(5000) codeSnippet?: string;
  @IsOptional() @IsString() @MaxLength(20) codeLanguage?: string;
  @IsOptional() @IsString() @MaxLength(3000) devopsCommand?: string;
  @IsString() @Length(3, 300) keyTakeaway: string;
}

export class SubjectDto {
  @IsString() @Length(2, 60) name: string;
  @IsString() @Length(5, 400) description: string;
  @IsHexColor() accent: string;
  @IsString() @Length(2, 60) group: string;
}
