import { BrainCircuit, Cloud, Code2, Container, Cpu, FlaskConical, GitBranch, Globe, Layers, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  BrainCircuit, Cloud, Code2, Container, Cpu, FlaskConical, GitBranch, Globe, Layers, Smartphone,
};

export function SubjectIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? Layers;
  return <Icon size={size} />;
}
