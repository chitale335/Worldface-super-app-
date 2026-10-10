import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  size?: number;
}

export const VerifiedBadge = ({ className, size = 18 }: Props) => (
  <span
    className={cn('inline-flex items-center text-sky-400', className)}
    title="Verified account"
    aria-label="Verified"
  >
    <BadgeCheck className="fill-sky-500 text-primary-foreground" style={{ width: size, height: size }} />
  </span>
);
