import { SeedSubject, SeedTopic } from './types';
import { core } from './core';
import { web } from './web';
import { python } from './python';
import { devops } from './devops';
import { EXTRA } from './extra';

/** Bump this whenever seed content changes. The service re-seeds automatically when the stored version differs. */
export const SEED_VERSION = 'v4-admin';

/** Documentation structure: sections in reading order, each with the topic slugs it contains. */
export const LAYOUT: Record<string, [string, string[]][]> = {
  'software-engineering': [['Foundations', ['solid-principles', 'design-patterns']], ['Delivery', ['agile-testing', 'git-version-control']], ['Architecture', ['system-design-basics']]],
  automata: [['Finite machines', ['finite-automata']], ['Beyond regular languages', ['context-free-languages', 'turing-machines']], ['Complexity', ['complexity-theory']]],
  dsa: [['Foundations', ['complexity-hashing', 'linear-structures']], ['Algorithms', ['sorting-searching', 'trees-graphs', 'dynamic-programming']]],
  'artificial-intelligence': [['Foundations', ['ml-fundamentals', 'neural-networks']], ['Modern AI', ['llms-rag', 'ai-in-production']]],
  'mern-stack': [['JavaScript', ['javascript-essentials']], ['Backend', ['node-express', 'rest-api-auth']], ['Frontend and data', ['react-hooks-state', 'mongo-react-next']]],
  'react-native': [['Getting started', ['rn-core', 'rn-navigation-expo']], ['Building apps', ['rn-state-native', 'rn-performance-release']]],
  python: [['The language', ['python-core', 'python-oop-decorators']], ['In practice', ['async-concurrency', 'python-testing-packaging']]],
  'flask-django': [['Flask', ['flask-basics', 'flask-production']], ['Django', ['django-fundamentals', 'django-orm-drf']]],
  docker: [['Basics', ['docker-fundamentals', 'compose-networking']], ['Production', ['docker-security-registries', 'docker-in-production']]],
  'devops-cloud': [['Foundations', ['linux-networking']], ['Delivery', ['cicd-nginx', 'infrastructure-as-code']], ['Operations', ['kubernetes-aws', 'observability']]],
};

function assemble(subject: SeedSubject): SeedSubject {
  const bySlug = new Map<string, SeedTopic>([...subject.topics, ...(EXTRA[subject.slug] ?? [])].map((t) => [t.slug, t]));
  const ordered: SeedTopic[] = [];
  for (const [section, slugs] of LAYOUT[subject.slug] ?? []) {
    for (const slug of slugs) {
      const t = bySlug.get(slug);
      if (!t) throw new Error(`Seed layout references missing topic ${subject.slug}/${slug}`);
      ordered.push({ ...t, section });
      bySlug.delete(slug);
    }
  }
  for (const t of bySlug.values()) ordered.push({ ...t, section: 'More' });
  return { ...subject, topics: ordered };
}

export const SEED: SeedSubject[] = [...core, ...web, ...python, ...devops].map(assemble);
