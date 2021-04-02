const React = require("react");

module.exports = {
  component,
  div,
  a,
  button,
  img,
  input,
  textarea,
  raw,
  bold,
  canvas,
};

function component(component, props, ...children) {
  return React.createElement(component, props, ...children);
}

function div(className, props, ...children) {
  return React.createElement("div", { className, ...props }, ...children);
}

function button(className, onClick, props, ...children) {
  return React.createElement(
    "button",
    { className, onClick, ...props },
    ...children
  );
}

function a(className, href, props, ...children) {
  return React.createElement("a", { className, href, ...props }, ...children);
}

function img(className, src, props, ...children) {
  return React.createElement("img", { className, src, ...props }, ...children);
}

function input(className, type, props, ...children) {
  return React.createElement(
    "input",
    { className, type, ...props },
    ...children
  );
}

function textarea(className, props, ...children) {
  return React.createElement("textarea", { className, ...props }, ...children);
}

function raw(html) {
  return React.createElement("div", {
    dangerouslySetInnerHTML: { __html: html },
  });
}

function bold(...children) {
  return React.createElement("b", {}, ...children);
}

function canvas(className, props, ...children) {
  return React.createElement("canvas", { className, ...props }, ...children);
}
