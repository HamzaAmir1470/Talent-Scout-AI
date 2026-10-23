import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage from '@/components/InfoPage';

export const metadata: Metadata = { title: 'About' };

export default function About() {
  return (
    <InfoPage eyebrow="About" title="We built the practice room we wished we had" intro="Most developers prepare for interviews by reading. The interview itself is a conversation, so the best preparation is a conversation too.">
      <h2>Why Talent Scout AI exists</h2>
      <p>Good engineers still stumble in interviews. They know the material but have never said it out loud, under a clock, to someone who asks a follow-up. Mock interviews with friends help, but they are hard to schedule and rarely honest enough.</p>
      <p>Talent Scout AI gives you an interviewer on demand. It asks real questions for your stack, listens to your answers and writes down exactly where you were strong and where you were thin.</p>
      <h2>What we believe</h2>
      <ul>
        <li><strong>Practice beats reading.</strong> Understanding a concept and explaining it are different skills.</li>
        <li><strong>Feedback should be specific.</strong> A score is only useful when it comes with the reason and the next step.</li>
        <li><strong>Learning material should be pleasant.</strong> Clear docs, real code and no walls of text.</li>
        <li><strong>Your data is yours.</strong> We do not store your audio and you can delete your transcripts at any time.</li>
      </ul>
      <h2>What is inside today</h2>
      <p>Documentation for ten technologies, a question bank with self-test and bookmarks, scheduled and instant AI voice interviews with scored reports, and a progress view that shows how you are improving. Start with the <Link href="/learn">docs</Link> or book a <Link href="/schedule">mock interview</Link>.</p>
    </InfoPage>
  );
}
