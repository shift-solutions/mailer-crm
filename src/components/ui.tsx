import type {
  ComponentProps,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";

export const surfaceClass =
  "rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium tracking-tight transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900";
const buttonVariants = {
  primary: "bg-stone-900 text-white shadow-sm hover:bg-stone-700",
  secondary: "border border-stone-200 bg-white text-stone-800 shadow-sm hover:bg-stone-50",
  ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  danger: "border border-red-200 bg-white text-red-700 shadow-sm hover:bg-red-50",
};
type Variant = keyof typeof buttonVariants;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button className={cn(buttonBase, buttonVariants[variant], className)} {...props} />
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link className={cn(buttonBase, buttonVariants[variant], className)} {...props} />
  );
}

const fieldBase =
  "block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm transition-shadow placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/15";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-20", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "pr-8", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string[] | string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const msg = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-stone-600">
        {label}
      </label>
      {children}
      {msg ? (
        <p className="text-xs text-red-600">{msg}</p>
      ) : hint ? (
        <p className="text-xs text-stone-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn(surfaceClass, className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <Link
            href={eyebrow.href}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M10 3.5 5.5 8 10 12.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {eyebrow.label}
          </Link>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <div className="mt-1.5 text-sm text-stone-500">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  tone,
  size = "lg",
}: {
  label: string;
  value: ReactNode;
  tone?: "good" | "bad";
  size?: "md" | "lg";
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-semibold tracking-tight tabular",
          size === "lg" ? "text-2xl" : "text-xl",
          tone === "good" && "text-green-700",
          tone === "bad" && "text-red-600",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
}) {
  const tones = {
    neutral: "bg-stone-100 text-stone-700",
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-sky-100 text-sky-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-stone-200/80", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
