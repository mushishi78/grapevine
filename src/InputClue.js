const React = require("react");
const { div, textarea, raw } = require("./react");

const checkmarkIcon = require("../eva-icons/fill/svg/checkmark.svg");

module.exports = {
  InputClue,
};

function InputClue({ onConfirm }) {
  const [value, setValue] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);

  const disabled = value == null || value === "" || confirming;
  const disabledClass = disabled ? "disabled" : "";

  React.useEffect(() => {
    document.querySelector(".InputClue_input").focus();
  }, []);

  function confirm() {
    if (disabled) return;
    setConfirming(true);
    onConfirm(value);
  }

  function onKeyPress(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      confirm();
    }
  }

  // prettier-ignore
  return div('InputClue', {},
    textarea('InputClue_input', { value, rows: 2, onChange: (event) => setValue(event.target.value), onKeyPress }),
    div(`InputClue_confirm ${disabledClass}`, { onClick: confirm }, raw(checkmarkIcon)))
}
