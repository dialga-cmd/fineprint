'use client';

import { useMemo } from 'react';
import {
  ChatCircle,
  ListChecks,
  MagicWand,
  Scales,
  Warning,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { ModeId } from '@/lib/types';

const MODE_ICON: Record<ModeId, PhosphorIcon> = {
  summarize: MagicWand,
  compare: Scales,
  risk: Warning,
  checklist: ListChecks,
  ask: ChatCircle,
};

export function ModeIcon({
  id,
  size = 16,
  weight = 'fill',
  className,
}: {
  id: ModeId;
  size?: number;
  weight?: 'regular' | 'bold' | 'fill' | 'duotone' | 'light' | 'thin';
  className?: string;
}) {
  const Icon = useMemo(() => MODE_ICON[id] ?? ChatCircle, [id]);
  return <Icon size={size} weight={weight} className={className} aria-hidden />;
}