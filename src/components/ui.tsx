import type { ReactNode } from 'react';
import type { Status } from '../engine/types';
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
      {STATUS_LABEL[status]}
      {technical && <span className="badge-tech"> · {status}</span>}
    </span>
  );
}

export function PageIntro({ step, title, children }: { step?: string; title: string; children: ReactNode }) {
  return (
    <div className="page-intro">
      {step && <div className="eyebrow">{step}</div>}
      <h2>{title}</h2>
      <div className="lead">{children}</div>
    </div>
  );
}

export function NextStep({ label, href, back }: { label: string; href: string; back?: { label: string; href: string } }) {
  return (
    <div className="next-step">
      {back ? (
        <a className="btn" href={back.href}>
          ← {back.label}
        </a>
      ) : (
        <span />
      )}
      <a className="btn primary" href={href}>
        {label} →
      </a>
    </div>
  );
}
