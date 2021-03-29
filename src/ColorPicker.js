const React = require("react");
const { div } = require("./react");

module.exports = {
  ColorPicker,
};

function ColorPicker({ brushColor, setBrushColor }) {
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
  "white",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "indigo",
  "violet",
];
