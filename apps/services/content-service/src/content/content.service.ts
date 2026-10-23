import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Documentation, DocumentationDocument, InterviewQuestion, InterviewQuestionDocument,
  Subject, SubjectDocument, Topic, TopicDocument,
} from './schemas/content.schemas';

const RANK: Record<string, number> = { beginner: 0, intermediate: 1, senior: 2 };

function clean(doc: any) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  for (const k of ['subjectId', 'topicId']) if (rest[k]) rest[k] = String(rest[k]);
  return { id: String(_id), ...rest };
}

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Subject.name) private readonly subjects: Model<SubjectDocument>,
    @InjectModel(Topic.name) private readonly topics: Model<TopicDocument>,
    @InjectModel(Documentation.name) private readonly docs: Model<DocumentationDocument>,
    @InjectModel(InterviewQuestion.name) private readonly questions: Model<InterviewQuestionDocument>,
  ) {}

  private async questionCounts(): Promise<Map<string, number>> {
    const rows = await this.questions.aggregate([{ $group: { _id: '$topicId', n: { $sum: 1 } } }]);
    return new Map(rows.map((r: any) => [String(r._id), r.n]));
  }

  async getSubjects() {
    const [subs, tops, counts] = await Promise.all([
      this.subjects.find().sort({ order: 1 }).lean(),
      this.topics.find().select('subjectId').lean(),
      this.questionCounts(),
    ]);
    return subs.map((s: any) => {
      const mine = tops.filter((t: any) => String(t.subjectId) === String(s._id));
      const questionCount = mine.reduce((n, t: any) => n + (counts.get(String(t._id)) ?? 0), 0);
      return { ...clean(s), topicCount: mine.length, questionCount };
    });
  }

  async getTopics(q: { subjectSlug?: string }) {
    const subs: any[] = await this.subjects.find().sort({ order: 1 }).lean();
    const filter: any = {};
    if (q.subjectSlug) {
      const s = subs.find((x) => x.slug === q.subjectSlug);
      if (!s) throw new RpcException({ status: 404, message: 'Subject not found' });
      filter.subjectId = s._id;
    }
    const [tops, counts] = await Promise.all([
      this.topics.find(filter).sort({ order: 1 }).lean(),
      this.questionCounts(),
    ]);
    const bySub = new Map<string, any>(subs.map((s) => [String(s._id), s]));
    return tops
      .map((t: any) => {
        const s = bySub.get(String(t.subjectId));
        return {
          ...clean(t),
          subjectSlug: s?.slug, subjectName: s?.name, subjectAccent: s?.accent,
          subjectOrder: s?.order ?? 0,
          questionCount: counts.get(String(t._id)) ?? 0,
        };
      })
      .sort((a, b) => a.subjectOrder - b.subjectOrder || a.order - b.order);
  }

  async getTopic(q: { subjectSlug: string; topicSlug: string }) {
    const subject: any = await this.subjects.findOne({ slug: q.subjectSlug }).lean();
    if (!subject) throw new RpcException({ status: 404, message: 'Subject not found' });
    const topic: any = await this.topics.findOne({ subjectId: subject._id, slug: q.topicSlug }).lean();
    if (!topic) throw new RpcException({ status: 404, message: 'Topic not found' });
    const [doc, qs, siblings] = await Promise.all([
      this.docs.findOne({ topicId: topic._id }).lean(),
      this.questions.find({ topicId: topic._id }).lean(),
      this.topics.find({ subjectId: subject._id }).sort({ order: 1 }).select('slug title minutes section').lean(),
    ]);
    const enrich = (x: any) => ({
      ...clean(x),
      topicSlug: topic.slug, topicTitle: topic.title,
      subjectSlug: subject.slug, subjectName: subject.name, subjectAccent: subject.accent,
    });
    return {
      subject: clean(subject),
      topic: clean(topic),
      documentation: doc ? clean(doc) : null,
      questions: qs.map(enrich).sort((a: any, b: any) => RANK[a.difficulty] - RANK[b.difficulty]),
      siblings: siblings.map(clean),
    };
  }

  async getQuestions(q: { subject?: string; topicId?: string; difficulty?: string }) {
    const subs: any[] = await this.subjects.find().lean();
    const tops: any[] = await this.topics.find().lean();
    const subById = new Map<string, any>(subs.map((s) => [String(s._id), s]));
    const topById = new Map<string, any>(tops.map((t) => [String(t._id), t]));

    const filter: any = {};
    if (q.difficulty) filter.difficulty = q.difficulty;
    if (q.topicId) filter.topicId = q.topicId;
    else if (q.subject) {
      const s = subs.find((x) => x.slug === q.subject);
      filter.topicId = { $in: tops.filter((t) => String(t.subjectId) === String(s?._id)).map((t) => t._id) };
    }

    const rows: any[] = await this.questions.find(filter).lean();
    return rows
      .map((r) => {
        const t = topById.get(String(r.topicId));
        const s = subById.get(String(t?.subjectId));
        return {
          ...clean(r),
          topicSlug: t?.slug, topicTitle: t?.title,
          subjectSlug: s?.slug, subjectName: s?.name, subjectAccent: s?.accent, subjectOrder: s?.order ?? 0,
        };
      })
      .sort((a, b) => a.subjectOrder - b.subjectOrder || RANK[a.difficulty] - RANK[b.difficulty]);
  }
}
