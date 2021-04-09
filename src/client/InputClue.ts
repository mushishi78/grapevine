import React from "react";
import { div, textarea, raw, button } from "./react";

interface Props {
  onConfirm: (value: string) => void;
}

export function InputClue({ onConfirm }: Props) {
  const [value, setValue] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);

  const disabled = value == null || value === "" || confirming;
  const disabledClass = disabled ? "disabled" : "";

  function confirm() {
    if (disabled) return;
    setConfirming(true);
    onConfirm(value);
  }

  function onKeyPress(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      confirm();
    }
  }

  // prettier-ignore
  return div('InputClue', {},
    textarea('InputClue_input', {
      value,
      rows: 2,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value),
      onKeyPress
    }),
    button(`InputClue_confirm ${disabledClass}`, confirm, {}, raw(checkmarkIcon)))
}

const checkmarkIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g data-name="Layer 2">
      <g data-name="checkmark">
        <rect width="24" height="24" opacity="0"/>
        <path d="M9.86 18a1 1 0 0 1-.73-.32l-4.86-5.17a1 1 0 1 1 1.46-1.37l4.12 4.39 8.41-9.2a1 1 0 1 1 1.48 1.34l-9.14 10a1 1 0 0 1-.73.33z"/>
      </g>
    </g>
  </svg>
`;
