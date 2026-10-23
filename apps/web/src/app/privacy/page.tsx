import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy policy' };

export default function Privacy() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy policy" intro="Last updated October 20, 2026. This page explains what we collect, why and the choices you have.">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and a hashed password.</li>
        <li><strong>Interview data:</strong> your bookings, the text transcript of each interview and your scored report.</li>
        <li><strong>Practice data:</strong> bookmarks and progress. Today these live in your browser storage.</li>
        <li><strong>Technical data:</strong> basic logs such as IP address and errors, used to keep the service secure and reliable.</li>
      </ul>
      <h2>Audio</h2>
      <p>We do not store your audio. In supported browsers, speech recognition runs through the browser, and the vendor of that browser may process the audio under its own policy. In other browsers, short audio clips are sent to our AI provider to be turned into text and are discarded afterward.</p>
      <h2>How we use AI providers</h2>
      <p>To run the interviewer and write your report, we send your transcript text to Google Gemini. We do not sell your data and we do not use it for advertising.</p>
      <h2>Retention and deletion</h2>
      <p>We keep your account, transcripts and reports until you ask us to remove them. Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and we will delete your data within 30 days.</p>
      <h2>Cookies and local storage</h2>
      <p>We store your sign-in token, theme choice and practice progress in your browser. We do not use third-party advertising cookies.</p>
      <h2>Security</h2>
      <p>Passwords are hashed. Connections use HTTPS. Access to your data is limited to your account and to the few people who operate the service.</p>
      <h2>Children</h2>
      <p>The service is not intended for people under 16.</p>
      <h2>Changes</h2>
      <p>If we change this policy in a meaningful way, we will tell you by email or in the app before it takes effect.</p>
    </InfoPage>
  );
}
