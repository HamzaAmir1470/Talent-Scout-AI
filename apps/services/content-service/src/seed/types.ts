export type Level = 'beginner' | 'intermediate' | 'senior';

export interface SeedQuestion {
  d: Level;
  q: string;
  a: string;
  t: string;
  code?: string;
  lang?: string;
  cmd?: string;
}
export interface SeedTopic {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  section?: string;
  doc: string;
  questions: SeedQuestion[];
}
export interface SeedSubject {
  slug: string;
  name: string;
  icon: string;
  accent: string;
  group: string;
  description: string;
  topics: SeedTopic[];
}
