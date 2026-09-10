"use client";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { sections } from "@/lib/config";
export function SelectionCard({
  label,
  selected,
  onClick,
  description,
  children,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  description?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={`selection-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      {children}
      <span className="selection-copy">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </span>
      <span className="selection-check" aria-hidden="true">
        {selected && <Check size={13} />}
      </span>
    </button>
  );
}
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  max,
  exclusive,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  exclusive?: string;
}) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          className={`chip ${value.includes(option) ? "selected" : ""}`}
          aria-pressed={value.includes(option)}
          disabled={!!max && value.length >= max && !value.includes(option)}
          key={option}
          onClick={() =>
            onChange(
              value.includes(option)
                ? value.filter((x) => x !== option)
                : option === exclusive
                  ? [option]
                  : [...value.filter((x) => x !== exclusive), option],
            )
          }
        >
          {value.includes(option) && <Check size={13} />} {option}
        </button>
      ))}
    </div>
  );
}
export function TextInput({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = props.id || props.name || label.replace(/\W/g, "");
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label}
        {props.required && <b aria-hidden="true"> *</b>}
      </span>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}
export function URLInput(props: Omit<Parameters<typeof TextInput>[0], "type">) {
  return (
    <TextInput
      {...props}
      type="url"
      inputMode="url"
      placeholder={props.placeholder || "https://"}
    />
  );
}
export function ProgressIndicator({
  step,
  onNavigate,
}: {
  step: number;
  onNavigate: (n: number) => void;
}) {
  return (
    <nav className="progress" aria-label="Project progress">
      {sections.map((label, i) => (
        <button
          type="button"
          key={label}
          disabled={i + 1 > step}
          aria-current={step === i + 1 ? "step" : undefined}
          className={
            step === i + 1 ? "current" : step > i + 1 ? "complete" : ""
          }
          onClick={() => onNavigate(i + 1)}
        >
          <span>
            {step > i + 1 ? (
              <Check size={13} />
            ) : (
              String(i + 1).padStart(2, "0")
            )}
          </span>
          <b>{label}</b>
        </button>
      ))}
    </nav>
  );
}
export function FormNavigation({
  step,
  busy,
  onBack,
  onNext,
}: {
  step: number;
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="form-navigation">
      <button type="button" className="back" onClick={onBack} disabled={busy}>
        <ArrowLeft size={17} /> Back
      </button>
      <span className="nav-note">
        {step === 6
          ? "A good place to begin."
          : "A little closer to something great."}
      </span>
      <button
        type="button"
        className="primary"
        onClick={onNext}
        disabled={busy}
      >
        {busy
          ? "Sending your brief…"
          : step === 6
            ? "Send Project Brief"
            : step === 5
              ? "Review your brief"
              : "Continue"}
        {!busy && <ArrowRight size={17} />}
      </button>
    </div>
  );
}
export function ReviewSection({
  title,
  items,
  onEdit,
}: {
  title: string;
  items: [string, string][];
  onEdit: () => void;
}) {
  return (
    <section className="review-section">
      <div className="review-heading">
        <h2>{title}</h2>
        <button type="button" onClick={onEdit}>
          Edit <ArrowRight size={13} />
        </button>
      </div>
      <dl>
        {items
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}
