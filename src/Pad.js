const React = require("react");
const { fabric } = require("fabric");
const { div, canvas } = require("./react");
const { getMin, getMax } = require("./number");

module.exports = {
  Pad,
};

function Pad({ onNewPath, fabricObjects, brushColor }) {
  const padRef = React.useRef();
  const canvasRef = React.useRef();

  React.useEffect(() => {
    const padElem = padRef.current;
    const canvasElem = padElem.querySelector(".Pad_canvas");
    canvasRef.current = new fabric.Canvas(canvasElem, {
      isDrawingMode: onNewPath != null,
      width: padElem.clientWidth,
      height: padElem.clientHeight,
    });

    canvasRef.current.freeDrawingBrush.width = 3;
    canvasRef.current.freeDrawingBrush.color = brushColor || "Black";

    canvasRef.current.on("path:created", ({ path }) => {
      onNewPath(path.toObject(), canvasRef.current.toObject());
    });

    window.addEventListener("resize", onResize);

    if (fabricObjects != null) {
      fabricObjects.objects.forEach((o) => {
        o.selectable = false;
        o.hoverCursor = "auto";
      });
      canvasRef.current.loadFromJSON(fabricObjects);
      fitCanvasToObjects(canvasRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  React.useEffect(() => {
    canvasRef.current.freeDrawingBrush.color = brushColor;
  }, [brushColor]);

  function onResize() {
    const padElem = document.querySelector(".Pad");

    canvasRef.current.setDimensions({
      width: padElem.clientWidth,
      height: padElem.clientHeight,
    });
  }

  function fitCanvasToObjects(canvas) {
    const objects = canvas.getObjects();
    const objectsTop = getMin(objects.map((o) => o.top));
    const objectsLeft = getMin(objects.map((o) => o.left));
    const objectsRight = getMax(objects.map((o) => o.left + o.width));
    const objectsBottom = getMax(objects.map((o) => o.top + o.height));
    const scaleX = canvas.width / objectsRight;
    const scaleY = canvas.height / objectsBottom;
    const scale = Math.min(scaleX, scaleY);
    const zoom = canvas.getZoom() * scale;
    canvas.setViewportTransform([1, 0, 0, 1, objectsLeft, objectsTop]);
    canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
  }

  // prettier-ignore
  return div("Pad", { ref: padRef },
    canvas("Pad_canvas"));
}
