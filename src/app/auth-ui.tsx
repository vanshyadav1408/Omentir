"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export const AUTH_TAGLINE = "Find buyers and book meetings on LinkedIn";

export function AuthHeading({
  title,
  subtitle,
  className = "",
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-2xl font-medium tracking-tight text-white">{title}</h1>
      {subtitle ? <p className="auth-muted mt-1.5 text-[15px] leading-snug">{subtitle}</p> : null}
    </div>
  );
}

export function AuthField({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="auth-label">{label}</span>
      <input className="auth-input" {...props} />
    </label>
  );
}

export const AuthTextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }
>(function AuthTextArea({ label, className = "", ...props }, ref) {
  return (
    <label className={`block ${className}`}>
      <span className="auth-label">{label}</span>
      <textarea ref={ref} className="auth-textarea" {...props} />
    </label>
  );
});

export function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px] shrink-0">
      <path
        fill="#4285F4"
        d="M47.532 24.552c0-1.636-.146-3.21-.418-4.722H24.48v8.94h12.93c-.557 3-2.252 5.541-4.798 7.243v6.022h7.762c4.541-4.184 7.158-10.341 7.158-17.483z"
      />
      <path
        fill="#34A853"
        d="M24.48 48c6.48 0 11.916-2.146 15.888-5.823l-7.762-6.022c-2.155 1.443-4.91 2.298-8.126 2.298-6.252 0-11.546-4.218-13.434-9.892H3.018v6.218C6.974 42.572 15.072 48 24.48 48z"
      />
      <path
        fill="#FBBC05"
        d="M11.046 28.561c-.48-1.443-.754-2.984-.754-4.561s.274-3.118.754-4.561v-6.218H3.018A23.94 23.94 0 0 0 .48 24c0 3.873.929 7.535 2.538 10.779l8.028-6.218z"
      />
      <path
        fill="#EA4335"
        d="M24.48 9.547c3.524 0 6.687 1.213 9.176 3.594l6.882-6.882C36.39 2.382 30.954 0 24.48 0 15.072 0 6.974 5.428 3.018 13.221l8.028 6.218c1.888-5.674 7.182-9.892 13.434-9.892z"
      />
    </svg>
  );
}

export function AuthSelect({
  label,
  name,
  options,
  className = "",
}: {
  label: string;
  name: string;
  options: string[];
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="auth-label">{label}</span>
      <select className="auth-input" name={name} required defaultValue="">
        <option value="" disabled>
          Select one
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AuthSwitchLine({ children }: { children: ReactNode }) {
  return <p className="auth-muted mt-6 text-center text-[13px]">{children}</p>;
}
