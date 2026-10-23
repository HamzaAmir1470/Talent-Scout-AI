import Header from './Header';

export default function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-10 pt-16 sm:px-6">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 text-lg leading-relaxed text-muted">{intro}</p>}
        <div className="md mt-10">{children}</div>
      </main>
    </>
  );
}
