import React from "react";
import { div, SetState } from "./react";

interface Props {
  brushColor: string;
  setBrushColor: SetState<string>;
}

export function ColorPicker({ brushColor, setBrushColor }: Props) {
  const [show, setShow] = React.useState(false);

  // prettier-ignore
  return div('ColorPicker', { tabIndex: -1, onBlur: () => setShow(false) },
      div('ColorPicker_current', {
        style: { background: brushColor },
        onClick: () => setShow(!show)
      }),
      show && div('ColorPicker_menu', {},
        colors.map(color =>
          div('ColorPicker_menuOption', {
            key: color,
            style: { background: color },
            onClick: () => setBrushColor(color)
          }))))
}

const colors = [
  "black",
  "grey",
  "white",
  "red",
  "orange",
  "brown",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
];
