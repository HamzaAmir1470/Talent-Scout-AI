import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContentAdminService } from './admin.service';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly content: ContentService, private readonly admin: ContentAdminService) {}

  @MessagePattern('health.ping')
  ping() {
    return 'pong';
  }

  @MessagePattern('content.getSubjects')
  getSubjects() {
    return this.content.getSubjects();
  }

  @MessagePattern('content.getTopics')
  getTopics(@Payload() q: { subjectSlug?: string }) {
    return this.content.getTopics(q ?? {});
  }

  @MessagePattern('content.getTopic')
  getTopic(@Payload() q: { subjectSlug: string; topicSlug: string }) {
    return this.content.getTopic(q);
  }

  @MessagePattern('content.getQuestions')
  getQuestions(@Payload() q: { subject?: string; topicId?: string; difficulty?: string }) {
    return this.content.getQuestions(q ?? {});
  }

  @MessagePattern('content.admin.listTopics') aList() { return this.admin.listTopics(); }
  @MessagePattern('content.admin.getTopic') aGet(@Payload() d: { id: string }) { return this.admin.getTopic(d.id); }
  @MessagePattern('content.admin.saveTopic') aSave(@Payload() d: any) { return this.admin.saveTopic(d); }
  @MessagePattern('content.admin.deleteTopic') aDel(@Payload() d: { id: string }) { return this.admin.deleteTopic(d.id); }
  @MessagePattern('content.admin.saveQuestion') aSaveQ(@Payload() d: any) { return this.admin.saveQuestion(d); }
  @MessagePattern('content.admin.deleteQuestion') aDelQ(@Payload() d: { id: string }) { return this.admin.deleteQuestion(d.id); }
  @MessagePattern('content.admin.saveSubject') aSaveS(@Payload() d: any) { return this.admin.saveSubject(d); }
  @MessagePattern('content.admin.stats') aStats() { return this.admin.stats(); }
}
