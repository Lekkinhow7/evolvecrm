import React from 'react';
import { ContactStage } from '@/types';
import { Badge, ChipGroup } from '@/design-system';
import type { BadgeProps } from '@/design-system';

interface StageCounts {
  LEAD: number;
  MQL: number;
  PROSPECT: number;
  CUSTOMER: number;
  OTHER: number;
}

interface ContactsStageTabs {
  activeStage: ContactStage | 'ALL';
  onStageChange: (stage: ContactStage | 'ALL') => void;
  counts: StageCounts;
}

/** Nome em português e tom do selo de cada estágio do contato. */
const STAGE_CONFIG: Record<keyof StageCounts, { label: string; tone: NonNullable<BadgeProps['tone']> }> = {
  LEAD: { label: 'Leads', tone: 'neutral' },
  MQL: { label: 'Qualificados', tone: 'info' },
  PROSPECT: { label: 'Em negociação', tone: 'warning' },
  CUSTOMER: { label: 'Clientes', tone: 'success' },
  OTHER: { label: 'Perdidos e outros', tone: 'neutral' },
};

/** Filtro por estágio do contato, em chips do design system. */
export const ContactsStageTabs: React.FC<ContactsStageTabs> = ({
  activeStage,
  onStageChange,
  counts,
}) => {
  const total = counts.LEAD + counts.MQL + counts.PROSPECT + counts.CUSTOMER + (counts.OTHER || 0);
  const options = [
    { value: 'ALL', label: 'Todos', count: total },
    ...(Object.keys(STAGE_CONFIG) as (keyof StageCounts)[]).map((stage) => ({
      value: stage,
      label: STAGE_CONFIG[stage].label,
      count: counts[stage] || 0,
    })),
  ];

  return (
    <ChipGroup
      size="sm"
      options={options}
      value={activeStage}
      onChange={(value) => onStageChange(value as ContactStage | 'ALL')}
    />
  );
};

/** Selo de estágio para as linhas da tabela. */
export const StageBadge: React.FC<{ stage: ContactStage | string }> = ({ stage }) => {
  const config = STAGE_CONFIG[stage as keyof StageCounts];
  return <Badge tone={config?.tone ?? 'neutral'}>{config?.label ?? stage}</Badge>;
};
