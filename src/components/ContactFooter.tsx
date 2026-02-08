import { cn } from '@/lib/utils';

interface ContactFooterProps {
  isExtension: boolean;
}

export function ContactFooter({ isExtension }: ContactFooterProps) {
  return (
    <div
      className={cn(
        "text-center text-xs py-2 border-t border-border",
        isExtension
          ? "fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
          : "mt-auto"
      )}
    >
      <span className="text-zinc-400">
        For any feedback please reach out to{' '}
        <a
          href="https://www.linkedin.com/in/sondhidhruv/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-zinc-400 hover:text-brand-purple transition-colors"
        >
          Dhruv Sondhi
        </a>
      </span>
    </div>
  );
}
