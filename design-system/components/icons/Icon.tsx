'use client';

import React from 'react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import type { StaticImageData } from 'next/image';
import contractorAccess from '../../assets/icons-3d/contractor-access.png';
import deviationsCapa from '../../assets/icons-3d/deviations-capa.png';
import employeeProfile from '../../assets/icons-3d/employee-profile.png';
import equipment from '../../assets/icons-3d/equipment.png';
import library from '../../assets/icons-3d/library.png';
import microbiology from '../../assets/icons-3d/microbiology.png';
import permissions from '../../assets/icons-3d/permissions.png';
import pestControl from '../../assets/icons-3d/pest-control.png';
import productionWaste from '../../assets/icons-3d/production-waste.png';
import recordsFiles from '../../assets/icons-3d/records-files.png';
import settings from '../../assets/icons-3d/settings.png';
import training from '../../assets/icons-3d/training.png';

/**
 * Lucide line icon (stroke = currentColor).
 * The Claude Design export fetched the SVG from the lucide-static CDN; here it comes from
 * `lucide-react/dynamic`, which the project already ships, so nothing is loaded from a third party.
 */
export interface IconProps {
  /** Lucide icon name, kebab-case, e.g. "activity", "square-check", "shield-check", "chevrons-left". */
  name: string;
  /** Pixel size (square). Default 18. Use 16 in nav rows, 18 in tiles, 20 in icon wells. */
  size?: number;
  /** Override color; defaults to currentColor. */
  color?: string;
  /** Lucide stroke width (default 2 on a 24 grid ≈ 1.5px at 18px). */
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible label; when omitted the icon is aria-hidden. */
  title?: string;
}

export type Icon3DName = 'microbiology' | 'contractor-access' | 'pest-control' | 'production-waste' | 'deviations-capa' | 'equipment' | 'records-files' | 'library' | 'training' | 'permissions' | 'employee-profile' | 'settings';
export interface Icon3DProps {
  name: Icon3DName;
  size?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ICONS_3D: Record<Icon3DName, StaticImageData> = {
  'contractor-access': contractorAccess,
  'deviations-capa': deviationsCapa,
  'employee-profile': employeeProfile,
  equipment,
  library,
  microbiology,
  permissions,
  'pest-control': pestControl,
  'production-waste': productionWaste,
  'records-files': recordsFiles,
  settings,
  training,
};

/** Line icon from the Lucide set. */
export function Icon({ name, size = 18, color, strokeWidth, className = '', style, title }: IconProps) {
  return (
    <span
      className={'at-icon ' + className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={Object.assign({ width: size, height: size, color: color }, style)}
    >
      <DynamicIcon name={name as IconName} size={size} strokeWidth={strokeWidth} />
    </span>
  );
}

/** Glass 3D illustration icon (PNG from design-system/assets/icons-3d, bundled by Next). */
export function Icon3D({ name, size = 96, alt = '', className = '', style }: Icon3DProps) {
  return <img className={'at-icon3d ' + className} src={ICONS_3D[name].src} alt={alt} width={size} height={size} style={Object.assign({ width: size, height: size }, style)} />;
}
