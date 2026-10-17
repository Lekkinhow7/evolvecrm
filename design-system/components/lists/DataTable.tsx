'use client';

import React from 'react';
import { Icon } from '../icons/Icon';

/** Airy data table — muted header, 64px rows, hairline separators; stacks into label/value cards on mobile. */
export interface DataTableColumn<Row = any> {
  key: string;
  label: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  numeric?: boolean;
  render?: (value: any, row: Row, index: number) => React.ReactNode;
}
export interface DataTableProps<Row = any> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  onRowClick?: (row: Row, index: number) => void;
  /** Trailing round chevron button per row */
  chevron?: boolean;
  density?: 'md' | 'compact';
  /** Under 640px, render each row as a stacked card (default true) */
  stackOnMobile?: boolean;
  rowKey?: string;
  className?: string;
}

export function DataTable<Row = any>({ columns = [], rows = [], onRowClick, chevron = false, density = 'md', stackOnMobile = true, rowKey, className = '' }: DataTableProps<Row>) {
  const cls = ['at-table', onRowClick ? 'at-table--clickable' : '', density === 'compact' ? 'at-table--compact' : '', stackOnMobile ? 'at-table--stack' : ''].filter(Boolean).join(' ');
  return (
    <div className={'at-table-wrap ' + className}>
      <table className={cls}>
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key} style={{ textAlign: c.align || 'left', width: c.width }}>{c.label}</th>)}
            {chevron ? <th className="at-table__chev" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? r[rowKey] : i} onClick={onRowClick ? () => onRowClick(r, i) : undefined}>
              {columns.map((c) => (
                <td key={c.key} data-label={typeof c.label === 'string' ? c.label : ''} className={c.numeric ? 'at-table__num' : undefined} style={{ textAlign: c.align || 'left' }}>
                  {c.render ? c.render(r[c.key], r, i) : r[c.key]}
                </td>
              ))}
              {chevron ? <td className="at-table__chev"><span className="at-iconbtn at-iconbtn--sm at-iconbtn--tinted at-iconbtn--round" style={{ display: 'inline-flex' }}><Icon name="chevron-right" size={16} /></span></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
