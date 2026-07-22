"use client";

import { useState, useRef, useEffect } from "react";
import { M3NotchedOutline } from "./text-field";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  imageUrl?: string;
  imageFallback?: string;
};

function optionInitials(option: SelectOption) {
  const source = option.imageFallback || option.label || option.value;
  return (
    source
      .split(/[\s@._-]+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LI"
  );
}

function OptionAvatar({ option, size = "sm" }: { option: SelectOption; size?: "sm" | "md" }) {
  const className =
    size === "md"
      ? "h-8 w-8 text-[11px]"
      : "h-6 w-6 text-[10px]";

  if (option.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={option.imageUrl}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${className} grid shrink-0 place-items-center rounded-full bg-[#0a66c2] font-semibold text-white`}
      aria-hidden="true"
    >
      {optionInitials(option)}
    </span>
  );
}

export function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  placeholder,
  className,
  menuPlacement = "bottom",
}: {
  label?: string;
  name?: string;
  options: SelectOption[] | string[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  menuPlacement?: "top" | "bottom";
}) {
  const normalizedOptions = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  const placeholder_ = placeholder ?? "Select one";

  // Controlled mode when value+onChange provided, otherwise internal state (form mode)
  const isControlled = value !== undefined && onChange !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const selected = isControlled ? value : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(val: string) {
    if (isControlled) {
      onChange(val);
    } else {
      setInternalValue(val);
    }
    setIsOpen(false);
  }

  const selectedLabel =
    normalizedOptions.find((o) => o.value === selected)?.label ?? selected;
  const selectedOption = normalizedOptions.find((o) => o.value === selected);

  const floated = isOpen || Boolean(selected);
  const fieldLabel = label || placeholder_;
  const originClass =
    menuPlacement === "top" ? "m3-menu--origin-bottom" : "m3-menu--origin-top";

  return (
    <div
      className={`m3-text-field m3-text-field--outlined ${className || ""}`}
      data-focused={isOpen ? "true" : "false"}
      data-floated={floated ? "true" : "false"}
      data-error="false"
      data-disabled="false"
      ref={ref}
    >
      <div className="m3-text-field__body">
        <span className="m3-text-field__label pointer-events-none" aria-hidden="true">
          {fieldLabel}
        </span>
        <div className="m3-text-field__shell">
          {/* Hidden input for form submissions */}
          {name ? (
            <input
              type="text"
              name={name}
              value={selected}
              onChange={() => {}}
              required={!isControlled}
              className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
              tabIndex={-1}
            />
          ) : null}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className={`m3-text-field__input flex w-full items-center justify-between gap-2 !h-[var(--md-sys-text-field-height)] !border-0 !bg-transparent !shadow-none text-left focus:outline-none ${
              selected ? "text-[var(--md-sys-color-field-text)]" : "text-transparent"
            }`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              {selectedOption?.imageUrl || selectedOption?.imageFallback ? (
                <OptionAvatar option={selectedOption} />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] leading-6">
                  {selected ? selectedLabel : "\u00a0"}
                </span>
                {selectedOption?.description ? (
                  <span className="mt-0.5 block truncate text-[11px] font-medium leading-4 text-[var(--md-sys-color-on-surface-variant)]">
                    {selectedOption.description}
                  </span>
                ) : null}
              </span>
            </span>
            <svg
              className={`shrink-0 text-[var(--md-sys-color-on-surface-variant)] transition-transform ${isOpen ? "rotate-180" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        <M3NotchedOutline label={fieldLabel} />
      </div>

      {isOpen ? (
        <div
          className={`m3-menu m3-menu-enter absolute z-50 w-full ${originClass} ${
            menuPlacement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          role="listbox"
        >
          <button
            type="button"
            className="m3-menu-item"
            onClick={() => select("")}
          >
            <span className="m3-menu-item__label truncate text-[var(--md-sys-color-on-surface-variant)]">
              {placeholder_}
            </span>
          </button>
          {normalizedOptions.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`m3-menu-item ${isSelected ? "m3-menu-item--selected" : ""}`}
                onClick={() => select(option.value)}
              >
                <span className="m3-menu-item__leading">
                  {option.imageUrl || option.imageFallback ? (
                    <OptionAvatar option={option} size="md" />
                  ) : null}
                  <span className="m3-menu-item__label min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="m3-menu-item__secondary">{option.description}</span>
                    ) : null}
                  </span>
                </span>
                {isSelected ? (
                  <span className="m3-menu-item__check material-symbols-outlined" aria-hidden="true">
                    check
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
