import React from 'react';
import { Segmented } from '@/design-system';
import { ViewMode } from '../hooks/useInboxController';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/** Modo de ver as Prioridades: resumo, lista ou um item por vez (Foco). */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  return (
    <Segmented
      variant="text"
      value={mode}
      onChange={(value) => onChange(value as ViewMode)}
      options={[
        { value: 'overview', label: 'Resumo' },
        { value: 'list', label: 'Lista' },
        { value: 'focus', label: 'Foco' },
      ]}
    />
  );
};
