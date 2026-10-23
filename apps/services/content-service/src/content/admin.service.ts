import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Documentation, DocumentationDocument, InterviewQuestion, InterviewQuestionDocument,
  Subject, SubjectDocument, Topic, TopicDocument,
} from './schemas/content.schemas';

const fail = (status: number, message: string) => new RpcException({ status, message });
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'topic';
const idOf = (o: any) => ({ ...o, id: String(o._id), _id: undefined, __v: undefined });

@Injectable()
export class ContentAdminService {
  constructor(
    @InjectModel(Subject.name) private readonly subjects: Model<SubjectDocument>,
    @InjectModel(Topic.name) private readonly topics: Model<TopicDocument>,
    @InjectModel(Documentation.name) private readonly docs: Model<DocumentationDocument>,
    @InjectModel(InterviewQuestion.name) private readonly questions: Model<InterviewQuestionDocument>,
  ) {}

  async listTopics() {
    const [subs, tops, counts]: any[] = await Promise.all([
      this.subjects.find().sort({ order: 1 }).lean(),
      this.topics.find().sort({ order: 1 }).lean(),
      this.questions.aggregate([{ $group: { _id: '$topicId', n: { $sum: 1 } } }]),
    ]);
    const qn = new Map<string, number>(counts.map((c: any) => [String(c._id), c.n]));
    return {
      subjects: subs.map((s: any) => ({ ...idOf(s) })),
      topics: subs.flatMap((s: any) => tops.filter((t: any) => String(t.subjectId) === String(s._id)).map((t: any) => ({
        id: String(t._id), subjectId: String(s._id), subjectSlug: s.slug, subjectName: s.name, slug: t.slug, title: t.title,
        section: t.section, minutes: t.minutes, order: t.order, adminEdited: t.adminEdited, questionCount: qn.get(String(t._id)) ?? 0,
      }))),
    };
  }

  async getTopic(id: string) {
    const t: any = isValidObjectId(id) ? await this.topics.findById(id).lean() : null;
    if (!t) throw fail(404, 'Topic not found');
    const [doc, qs, subject]: any[] = await Promise.all([
      this.docs.findOne({ topicId: t._id }).lean(),
      this.questions.find({ topicId: t._id }).lean(),
      this.subjects.findById(t.subjectId).lean(),
    ]);
    return {
      topic: { ...idOf(t), subjectId: String(t.subjectId), subjectSlug: subject?.slug, subjectName: subject?.name },
      markdown: doc?.markdown ?? '',
      questions: qs.map((q: any) => ({ ...idOf(q), topicId: String(q.topicId) })),
    };
  }

  async saveTopic(d: any) {
    const fields = {
      title: String(d.title).trim(), summary: String(d.summary ?? '').trim(), minutes: Number(d.minutes) || 5,
      section: String(d.section || 'General').trim(), adminEdited: true,
    };
    if (d.id) {
      if (!isValidObjectId(d.id)) throw fail(404, 'Topic not found');
      const t: any = await this.topics.findById(d.id);
      if (!t) throw fail(404, 'Topic not found');
      const set: any = { ...fields };
      if (Number.isFinite(Number(d.order))) set.order = Number(d.order);
      await this.topics.updateOne({ _id: t._id }, { $set: set });
      await this.docs.updateOne({ topicId: t._id }, { $set: { markdown: String(d.markdown), readingMinutes: fields.minutes } }, { upsert: true });
      return { id: String(t._id) };
    }
    const subject: any = await this.subjects.findOne({ slug: d.subjectSlug });
    if (!subject) throw fail(400, 'Choose a technology for this page');
    let slug = slugify(fields.title);
    if (await this.topics.findOne({ subjectId: subject._id, slug })) slug = `${slug}-${Date.now().toString(36)}`;
    const last: any = await this.topics.findOne({ subjectId: subject._id }).sort({ order: -1 }).lean();
    const t: any = await this.topics.create({ ...fields, subjectId: subject._id, slug, order: (last?.order ?? -1) + 1 });
    await this.docs.create({ topicId: t._id, markdown: String(d.markdown), readingMinutes: fields.minutes });
    return { id: String(t._id) };
  }

  async deleteTopic(id: string) {
    const t: any = isValidObjectId(id) ? await this.topics.findById(id) : null;
    if (!t) throw fail(404, 'Topic not found');
    await Promise.all([this.docs.deleteMany({ topicId: t._id }), this.questions.deleteMany({ topicId: t._id }), this.topics.deleteOne({ _id: t._id })]);
    return { ok: true, title: t.title };
  }

  async saveQuestion(d: any) {
    const f = {
      difficulty: d.difficulty, question: String(d.question).trim(), answer: String(d.answer).trim(),
      codeSnippet: d.codeSnippet?.trim() || undefined, codeLanguage: d.codeLanguage?.trim() || undefined,
      devopsCommand: d.devopsCommand?.trim() || undefined, keyTakeaway: String(d.keyTakeaway).trim(), adminEdited: true,
    };
    if (d.id) {
      if (!isValidObjectId(d.id)) throw fail(404, 'Question not found');
      const res = await this.questions.updateOne({ _id: d.id }, { $set: f });
      if (!res.matchedCount) throw fail(404, 'Question not found');
      return { id: d.id };
    }
    if (!isValidObjectId(d.topicId) || !(await this.topics.exists({ _id: d.topicId }))) throw fail(400, 'Choose a topic for this question');
    const q: any = await this.questions.create({ ...f, topicId: d.topicId, key: `custom/${d.topicId}/${Date.now().toString(36)}` });
    return { id: String(q._id) };
  }

  async deleteQuestion(id: string) {
    const res = isValidObjectId(id) ? await this.questions.deleteOne({ _id: id }) : { deletedCount: 0 };
    if (!res.deletedCount) throw fail(404, 'Question not found');
    return { ok: true };
  }

  async saveSubject(d: any) {
    if (!isValidObjectId(d.id)) throw fail(404, 'Technology not found');
    const res = await this.subjects.updateOne({ _id: d.id }, { $set: { name: d.name, description: d.description, accent: d.accent, group: d.group, adminEdited: true } });
    if (!res.matchedCount) throw fail(404, 'Technology not found');
    return { ok: true };
  }

  async stats() {
    const [subjects, topics, questions, edited] = await Promise.all([
      this.subjects.countDocuments({}), this.topics.countDocuments({}), this.questions.countDocuments({}),
      this.topics.countDocuments({ adminEdited: true }),
    ]);
    const byLevel: any[] = await this.questions.aggregate([{ $group: { _id: '$difficulty', n: { $sum: 1 } } }]);
    return { subjects, topics, questions, editedTopics: edited, byLevel: Object.fromEntries(byLevel.map((r) => [r._id, r.n])) };
  }
}
