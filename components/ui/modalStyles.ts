/**
 * Modal design tokens (Tailwind class strings).
 *
 * Goal: keep all modals visually/behaviorally coherent:
 * - consistent overlay (color + blur + padding)
 * - consistent panel (radius + border + shadow)
 * - consistent viewport caps (no overflow on small screens)
 * - consistent header/body/footer spacing
 */
export const MODAL_OVERLAY_CLASS =
  // Use a very high z-index so modals never render behind fixed sidebars/overlays.
  // On desktop, avoid covering the left navigation sidebar by offsetting from `--app-sidebar-width`.
  'fixed inset-0 md:left-[var(--app-sidebar-width,0px)] z-[9999] flex items-stretch sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4';

export const MODAL_PANEL_BASE_CLASS =
  'bg-[var(--surface-card)] border border-[var(--border-hairline)] shadow-[var(--shadow-lg)] w-full flex flex-col overflow-hidden rounded-[var(--radius-xl)]';

// Hard caps to avoid overflow. `dvh` is more stable on mobile browser chrome than `vh`.
export const MODAL_VIEWPORT_CAP_CLASS =
  // UX: default modals should not feel "full screen". Keep room around them.
  'max-h-[calc(90dvh-1rem)] sm:max-h-[calc(90dvh-2rem)]';

export const MODAL_HEADER_CLASS =
  'px-5 pt-5 pb-3 sm:px-6 sm:pt-6 flex items-center justify-between gap-3 shrink-0';

export const MODAL_TITLE_CLASS =
  'text-lg sm:text-xl font-semibold text-[var(--text-primary)]';

export const MODAL_CLOSE_BUTTON_CLASS =
  'p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] rounded-[var(--radius-pill)] transition-colors focus-visible-ring';

export const MODAL_BODY_CLASS = 'px-5 pb-5 pt-2 sm:px-6 sm:pb-6';

export const MODAL_FOOTER_CLASS =
  'px-5 py-4 sm:px-6 border-t border-[var(--border-hairline)] bg-[var(--surface-card)] shrink-0';


// Campos de formulário dentro de modais (mesmo visual do TextField do design system).
export const FIELD_LABEL_CLASS =
  'block text-[length:var(--fs-caption)] text-[var(--text-secondary)] mb-1.5';

export const FIELD_INPUT_CLASS =
  'w-full min-h-11 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--surface-sunken)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--cyan-400)] focus:bg-[var(--surface-card)] focus:shadow-[var(--focus-ring)] dark:[color-scheme:dark]';

export const FIELD_HINT_CLASS = 'mt-1.5 text-[length:var(--fs-micro)] text-[var(--text-tertiary)]';
