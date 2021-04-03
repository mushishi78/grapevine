import React from "react";

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export function component<Props>(
  component:
    | React.FunctionComponent<Props>
    | React.VoidFunctionComponent<Props>,
  props: Props,
  ...children: React.ReactNode[]
) {
  return React.createElement(component, props, ...children);
}

export function div(
  className: string,
  props?: React.HTMLProps<any>,
  ...children: React.ReactNode[]
) {
  return React.createElement("div", { className, ...props }, ...children);
}

export function button(
  className: string,
  onClick: () => void,
  props?: React.HTMLProps<any>,
  ...children: React.ReactNode[]
) {
  return React.createElement(
    "button",
    { className, onClick, ...props },
    ...children
  );
}

export function a(
  className: string,
  href: string,
  props?: React.HTMLProps<any>,
  ...children: React.ReactNode[]
) {
  return React.createElement("a", { className, href, ...props }, ...children);
}

export function img(
  className: string,
  src: string,
  props?: React.HTMLProps<any>,
  ...children: React.ReactNode[]
) {
  return React.createElement("img", { className, src, ...props }, ...children);
}

export function input(
  className: string,
  type: string,
  props?: React.HTMLProps<any>,
  ...children: React.ReactNode[]
) {
  return React.createElement(
    "input",
    { className, type, ...props },
    ...children
  );
}

export function textarea(
  className: string,
  props?: React.HTMLProps<any>,
  ...children: React.ReactNode[]
) {
  return React.createElement("textarea", { className, ...props }, ...children);
}

export function raw(html: string) {
  return React.createElement("div", {
    dangerouslySetInnerHTML: { __html: html },
  });
}

export function bold(...children: React.ReactNode[]) {
  return React.createElement("b", {}, ...children);
}

export function canvas(
  className: string,
  props?: React.HTMLProps<any>,
  ...children: React.ReactNode[]
) {
  return React.createElement("canvas", { className, ...props }, ...children);
}
