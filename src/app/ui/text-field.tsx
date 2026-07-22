"use client";

import {
  useId,
  useState,
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  type ChangeEvent,
  type FocusEvent,
} from "react";

export type TextFieldVariant = "outlined" | "filled";

type SharedProps = {
  label?: string;
  /** Outlined (default): full rounded border. Filled: soft fill + bottom accent (search). */
  variant?: TextFieldVariant;
  error?: boolean | string;
  supportingText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  /**
   * @deprecated Notch is a true border gap (M3). Kept for call-site compat; ignored.
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

function useFloated(
  controlledValue: string | number | readonly string[] | undefined,
  defaultValue: string | number | readonly string[] | undefined,
  focused: boolean,
) {
  const [uncontrolledHasValue, setUncontrolledHasValue] = useState(() => {
    if (defaultValue === undefined || defaultValue === null) return false;
    return String(defaultValue).length > 0;
  });

  const hasValue =
    controlledValue !== undefined
      ? String(controlledValue).length > 0
      : uncontrolledHasValue;

  return {
    floated: focused || hasValue,
    setUncontrolledHasValue,
  };
}

/** Classic M3 notched outline — top border gap sizes to the label spacer (no surface fill). */
export function M3NotchedOutline({ label }: { label?: string }) {
  return (
    <span className="m3-text-field__outline" aria-hidden="true">
      <span className="m3-text-field__outline-start" />
      <span className="m3-text-field__outline-notch">
        {label ? (
          <span className="m3-text-field__notch-spacer">{label}</span>
        ) : null}
      </span>
      <span className="m3-text-field__outline-end" />
    </span>
  );
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
  floated,
  disabled,
  isTextarea,
  children,
}: SharedProps & {
  htmlFor: string;
  focused: boolean;
  floated: boolean;
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
      data-floated={floated || !hasLabel ? "true" : "false"}
      data-error={showError ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
    >
      {/* Label lives in __body so floated top:0 centers on the shell top border
          (not relative to field padding). Shell stays overflow:hidden for fills. */}
      <div className="m3-text-field__body">
        {hasLabel ? (
          <label className="m3-text-field__label" htmlFor={htmlFor}>
            {label}
          </label>
        ) : null}
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
        {isOutlined ? (
          <M3NotchedOutline label={hasLabel ? label : undefined} />
        ) : null}
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
      onChange,
      value,
      defaultValue,
      placeholder,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [focused, setFocused] = useState(false);
    const { floated, setUncontrolledHasValue } = useFloated(
      value,
      defaultValue,
      focused,
    );
    const helperId =
      (typeof error === "string" && error) || supportingText
        ? `${inputId}-supporting`
        : undefined;

    // Space placeholder enables empty-state detection when no visible placeholder
    const inputPlaceholder = placeholder ?? (label ? " " : undefined);

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
        floated={floated}
        disabled={disabled}
      >
        <input
          ref={ref}
          id={inputId}
          className="m3-text-field__input"
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          placeholder={inputPlaceholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
          onFocus={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            if (value === undefined) {
              setUncontrolledHasValue(event.target.value.length > 0);
            }
            onChange?.(event);
          }}
          {...rest}
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
      onChange,
      value,
      defaultValue,
      placeholder,
      rows = 3,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [focused, setFocused] = useState(false);
    const { floated, setUncontrolledHasValue } = useFloated(
      value,
      defaultValue,
      focused,
    );
    const helperId =
      (typeof error === "string" && error) || supportingText
        ? `${inputId}-supporting`
        : undefined;
    const inputPlaceholder = placeholder ?? (label ? " " : undefined);

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
        floated={floated}
        disabled={disabled}
        isTextarea
      >
        <textarea
          ref={ref}
          id={inputId}
          className="m3-text-field__input"
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          placeholder={inputPlaceholder}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={helperId}
          onFocus={(event: FocusEvent<HTMLTextAreaElement>) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event: FocusEvent<HTMLTextAreaElement>) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            if (value === undefined) {
              setUncontrolledHasValue(event.target.value.length > 0);
            }
            onChange?.(event);
          }}
          {...rest}
        />
      </FieldShell>
    );
  },
);
