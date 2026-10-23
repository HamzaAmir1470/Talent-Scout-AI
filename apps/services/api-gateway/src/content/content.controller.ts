import { Controller, Get, Header, Inject, Param, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CacheService } from '../common/cache.service';
import { rpc } from '../rpc';

const TTL = 300; // content changes rarely, so five minutes keeps Mongo and the content service calm under load

const Cacheable = () => Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

@Controller('content')
export class ContentController {
  constructor(
    @Inject('CONTENT_SERVICE') private readonly client: ClientProxy,
    private readonly cache: CacheService,
  ) {}

  @Cacheable()
  @Get('subjects')
  subjects() {
    return this.cache.wrap('content:subjects', TTL, () => rpc(this.client, 'content.getSubjects', {}));
  }

  @Cacheable()
  @Get('topics')
  topics(@Query('subject') subjectSlug?: string) {
    return this.cache.wrap(`content:topics:${subjectSlug ?? 'all'}`, TTL, () =>
      rpc(this.client, 'content.getTopics', { subjectSlug }));
  }

  @Cacheable()
  @Get('topics/:subject/:topic')
  topic(@Param('subject') subjectSlug: string, @Param('topic') topicSlug: string) {
    return this.cache.wrap(`content:topic:${subjectSlug}:${topicSlug}`, TTL, () =>
      rpc(this.client, 'content.getTopic', { subjectSlug, topicSlug }));
  }

  @Cacheable()
  @Get('questions')
  questions(@Query('subject') subject?: string, @Query('topicId') topicId?: string, @Query('difficulty') difficulty?: string) {
    return this.cache.wrap(`content:q:${subject ?? ''}:${topicId ?? ''}:${difficulty ?? ''}`, TTL, () =>
      rpc(this.client, 'content.getQuestions', { subject, topicId, difficulty }));
  }
}
