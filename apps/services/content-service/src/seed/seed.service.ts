import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Documentation, DocumentationDocument, InterviewQuestion, InterviewQuestionDocument,
  Subject, SubjectDocument, Topic, TopicDocument,
} from '../content/schemas/content.schemas';
import { SEED, SEED_VERSION } from './data';

/**
 * Merges the built-in library into the database. Content an admin has edited (adminEdited) is never overwritten,
 * so the admin panel and the seed files can live side by side. RESEED=true wipes everything and starts over.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly log = new Logger(SeedService.name);

  constructor(
    private readonly cfg: ConfigService,
    @InjectModel(Subject.name) private readonly subjects: Model<SubjectDocument>,
    @InjectModel(Topic.name) private readonly topics: Model<TopicDocument>,
    @InjectModel(Documentation.name) private readonly docs: Model<DocumentationDocument>,
    @InjectModel(InterviewQuestion.name) private readonly questions: Model<InterviewQuestionDocument>,
  ) {}

  async onApplicationBootstrap() {
    const force = this.cfg.get<string>('RESEED') === 'true';
    const meta = this.subjects.db.collection('seed_meta');
    const stored: any = await meta.findOne({ _id: 'seed' as any });
    const empty = (await this.subjects.estimatedDocumentCount()) === 0;
    if (!force && !empty && stored?.version === SEED_VERSION) return;
    if (force) await Promise.all([this.subjects.deleteMany({}), this.topics.deleteMany({}), this.docs.deleteMany({}), this.questions.deleteMany({})]);

    let added = 0;
    let updated = 0;
    for (const [si, s] of SEED.entries()) {
      const sFields = { name: s.name, icon: s.icon, accent: s.accent, group: s.group, description: s.description, order: si };
      let subject: any = await this.subjects.findOne({ slug: s.slug });
      if (!subject) subject = await this.subjects.create({ slug: s.slug, ...sFields });
      else if (!subject.adminEdited) await this.subjects.updateOne({ _id: subject._id }, { $set: sFields });

      for (const [ti, t] of s.topics.entries()) {
        const tFields = { title: t.title, summary: t.summary, minutes: t.minutes, section: t.section ?? 'General', order: ti };
        let topic: any = await this.topics.findOne({ subjectId: subject._id, slug: t.slug });
        if (!topic) { topic = await this.topics.create({ subjectId: subject._id, slug: t.slug, ...tFields }); added++; }
        const editable = !topic.adminEdited;
        if (editable) {
          if (topic.title !== undefined) await this.topics.updateOne({ _id: topic._id }, { $set: tFields });
          await this.docs.updateOne({ topicId: topic._id }, { $set: { markdown: t.doc.trim(), readingMinutes: t.minutes } }, { upsert: true });
          updated++;
        }
        for (const [qi, q] of t.questions.entries()) {
          const key = `${s.slug}/${t.slug}/${qi + 1}`;
          const qFields = {
            difficulty: q.d, question: q.q, answer: q.a.trim(), codeSnippet: q.code?.trim(), codeLanguage: q.lang,
            devopsCommand: q.cmd?.trim(), keyTakeaway: q.t,
          };
          const existing: any = await this.questions.findOne({ key });
          if (!existing) await this.questions.create({ key, topicId: topic._id, ...qFields });
          else if (!existing.adminEdited) await this.questions.updateOne({ _id: existing._id }, { $set: { topicId: topic._id, ...qFields } });
        }
      }
    }
    await meta.updateOne({ _id: 'seed' as any }, { $set: { version: SEED_VERSION, at: new Date() } }, { upsert: true });
    this.log.log(`Seed ${SEED_VERSION}: ${added} topics added, ${updated} refreshed, admin-edited content preserved`);
  }
}
