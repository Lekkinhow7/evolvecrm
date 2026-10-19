import React from 'react';
import { Segmented } from '@/design-system';

interface ContactsTabsProps {
    viewMode: 'people' | 'companies';
    setViewMode: (mode: 'people' | 'companies') => void;
    contactsCount: number;
    companiesCount: number;
}

/** Alterna entre Pessoas e Empresas. */
export const ContactsTabs: React.FC<ContactsTabsProps> = ({
    viewMode,
    setViewMode,
    contactsCount,
    companiesCount
}) => {
    return (
        <Segmented
            variant="text"
            value={viewMode}
            onChange={(value) => setViewMode(value as 'people' | 'companies')}
            options={[
                { value: 'people', label: `Pessoas · ${contactsCount.toLocaleString('pt-BR')}` },
                { value: 'companies', label: `Empresas · ${companiesCount.toLocaleString('pt-BR')}` },
            ]}
        />
    );
};
