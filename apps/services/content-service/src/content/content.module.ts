import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentAdminService } from './admin.service';
import { ContentService } from './content.service';
import { SeedService } from '../seed/seed.service';
import {
  Documentation, DocumentationSchema, InterviewQuestion, InterviewQuestionSchema,
  Subject, SubjectSchema, Topic, TopicSchema,
} from './schemas/content.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: Documentation.name, schema: DocumentationSchema },
      { name: InterviewQuestion.name, schema: InterviewQuestionSchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService, ContentAdminService, SeedService],
})
export class ContentModule {}
