import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type ShellProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  art?: boolean;
  showBackToLearn?: boolean;
  className?: string;
};

export function ScreenShell({ title, action, children, art = true, showBackToLearn = true, className = "" }: ShellProps) {
  return (
    <div className={`screen-shell ${className}`.trim()}>
      <div className="paper-grid" aria-hidden="true" />
      {art ? <BotanicalMark /> : null}
      <header className="topbar">
        <Link aria-label={showBackToLearn ? "返回每日旅程" : undefined} className="brand" href="/learn">
          {showBackToLearn ? <BackToLearnIcon /> : null}
          {title}
        </Link>
        <div className="top-action">{action}</div>
      </header>
      <main className="screen-main">{children}</main>
    </div>
  );
}

function BackToLearnIcon() {
  return (
    <span className="brand-back-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "soft";
}) {
  return (
    <Link className={`app-button ${variant}`} href={href}>
      {children}
    </Link>
  );
}

export function AppButton({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: "primary" | "soft";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button className={`app-button ${variant}`} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}

export function ProgressBars({ value, total }: { value: number; total: number }) {
  return (
    <div className="progress-bars" aria-label={`进度 ${value}/${total}`}>
      {Array.from({ length: total }).map((_, index) => (
        <span className={index < value ? "on" : ""} key={index} />
      ))}
    </div>
  );
}

export function CircleIcon({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "gold" | "navy" }) {
  return <span className={`circle-icon ${tone}`}>{children}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function StudyDeskArt() {
  return (
    <div className="study-desk-art" aria-hidden="true">
      <Image src="/assets/study-desk.png" alt="" fill sizes="(max-width: 900px) 90vw, 55vw" priority />
    </div>
  );
}

export function BotanicalMark() {
  return (
    <div className="botanical-mark" aria-hidden="true">
      <span />
      <span />
      <i />
    </div>
  );
}

export function LockIcon() {
  return <span className="lock-icon" aria-hidden="true" />;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="section-label">{children}</p>;
}
