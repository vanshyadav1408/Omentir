"use client";

import {
  useId,
  useState,
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  type FocusEvent,
} from "react";

export type TextFieldVariant = "outlined" | "filled";

type SharedProps = {
  label?: string;
  /** Outlined (default): 1px border like the login email field. Filled: soft fill (search). */
  variant?: TextFieldVariant;
  error?: boolean | string;
  supportingText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  /**
   * @deprecated Notch is gone. Kept for call-site compat; ignored.
   */
  labelSurface?: string;
};

export type TextFieldProps = SharedProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size">;

export type TextAreaFieldProps = SharedProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
    rows?: number;
  };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function FieldShell({
  label,
  variant = "outlined",
  error,
  supportingText,
  leadingIcon,
  trailingIcon,
  className,
  htmlFor,
  focused,
  disabled,
  isTextarea,
  children,
}: SharedProps & {
  htmlFor: string;
  focused: boolean;
  disabled?: boolean;
  isTextarea?: boolean;
  children: ReactNode;
}) {
  const errorText = typeof error === "string" ? error : undefined;
  const showError = Boolean(error);
  const helper = errorText || supportingText;
  const helperId = helper ? `${htmlFor}-supporting` : undefined;
  const hasLabel = Boolean(label);
  const isOutlined = variant !== "filled";

  return (
    <div
      className={cx(
        "m3-text-field",
        isOutlined ? "m3-text-field--outlined" : "m3-text-field--filled",
        !hasLabel && "m3-text-field--no-label",
        Boolean(leadingIcon) && "m3-text-field--has-leading",
        Boolean(trailingIcon) && "m3-text-field--has-trailing",
        isTextarea && "m3-text-field--textarea",
        className,
      )}
      data-focused={focused ? "true" : "false"}
      data-error={showError ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
    >
      {hasLabel ? (
        <label className="m3-text-field__label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      <div className="m3-text-field__body">
        <div className="m3-text-field__shell">
          {leadingIcon ? (
            <span className="m3-text-field__affix" aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <div className="m3-text-field__control">{children}</div>
          {trailingIcon ? (
            <span className="m3-text-field__affix m3-text-field__affix--trailing">
              {trailingIcon}
            </span>
          ) : null}
        </div>
      </div>
      {helper ? (
        <p
          id={helperId}
          className="m3-text-field__supporting"
          role={showError ? "alert" : undefined}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      variant = "outlined",
      error,
      supportingText,
      leadingIcon,
      trailingIcon,
      className,
      labelSurface: _labelSurface,
      id,
      disabled,
      onFocus,
      onBlur,
      placeholder,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [focused, setFocused] = useState(false);
    const helperId =
      (typeof error === "string" && error) || supportingText
        ? `${inputId}-supporting`
        : undefined;

    return (
      <FieldShell
        label={label}
        variant={variant}
        error={error}
        supportingText={supportingText}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        className={className}
        htmlFor={inputId}
        focused={focused}
        disabled={disabled}
      >
        <input
          ref={ref}
          id={inputId}
          className="m3-text-field__input"
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
          {...rest}
          onFocus={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </FieldShell>
    );
  },
);

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    {
      label,
      variant = "outlined",
      error,
      supportingText,
      leadingIcon,
      trailingIcon,
      className,
      labelSurface: _labelSurface,
      id,
      disabled,
      onFocus,
      onBlur,
      placeholder,
      rows = 3,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [focused, setFocused] = useState(false);
    const helperId =
      (typeof error === "string" && error) || supportingText
        ? `${inputId}-supporting`
        : undefined;

    return (
      <FieldShell
        label={label}
        variant={variant}
        error={error}
        supportingText={supportingText}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        className={className}
        htmlFor={inputId}
        focused={focused}
        disabled={disabled}
        isTextarea
      >
        <textarea
          ref={ref}
          id={inputId}
          className="m3-text-field__input"
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
          {...rest}
          onFocus={(event: FocusEvent<HTMLTextAreaElement>) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event: FocusEvent<HTMLTextAreaElement>) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </FieldShell>
    );
  },
);
