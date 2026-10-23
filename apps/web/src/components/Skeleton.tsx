export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}
export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="glass border-rose-400/30 p-5 text-sm text-rose-300">
      {message}. Make sure the gateway and content service are running.
    </div>
  );
}
