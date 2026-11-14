import type { ReactNode } from 'react';
import { Building, Building2, Factory, Hospital, Hotel, School, Sprout, Waves, type LucideIcon } from 'lucide-react';
import type { CustomerCategory, Status } from '../engine/types';
import { STATUS_CLASS, STATUS_LABEL } from '../format';

/** Small "?" bubble that explains a term on hover or keyboard focus. */
export function Info({ children }: { children: ReactNode }) {
  return (
    <span className="info" tabIndex={0} role="note" aria-label="More information">
      ?<span className="info-pop">{children}</span>
    </span>
  );
}

export function StatusBadge({ status, technical = false }: { status: Status; technical?: boolean }) {
  return (
    <span className={`badge ${STATUS_CLASS[status]}`} title={`Screening status: ${status}`}>
      <i className="dot" />
      {STATUS_LABEL[status]}
      {technical && <span className="badge-tech"> · {status}</span>}
    </span>
  );
}

const CATEGORY_ICON: Record<CustomerCategory, LucideIcon> = {
  Hospital: Hospital,
  'Indoor pool': Waves,
  Greenhouse: Sprout,
  'Apartment complex': Building2,
  'Office building': Building,
  Hotel: Hotel,
  School: School,
  'Industrial process': Factory,
};

/** Dark rounded tile with the building-type icon. */
export function CategoryTile({ category, size = 'md' }: { category: CustomerCategory; size?: 'md' | 'lg' }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <span className={`tile tile-${size}`} aria-hidden>
      <Icon size={size === 'lg' ? 22 : 18} strokeWidth={1.8} />
    </span>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}

export function NextStep({ label, href, back }: { label: string; href: string; back?: { label: string; href: string } }) {
  return (
    <div className="next-step">
      {back ? (
        <a className="pill ghost" href={back.href}>
          ← {back.label}
        </a>
      ) : (
        <span />
      )}
      <a className="pill dark" href={href}>
        {label} →
      </a>
    </div>
  );
}
