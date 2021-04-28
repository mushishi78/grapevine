import React from "react";
import { fabric } from "fabric";
import { div, canvas } from "./react";
import { getMin, getMax } from "../shared/number";

export type FabricObjects = { objects: fabric.Object[] };
export type SetFabricObjects = (fabricObjects: FabricObjects) => void;

interface Props {
  setFabricObject?: SetFabricObjects;
  fabricObjects?: { objects: fabric.Object[] };
  brushColor?: string;
}

export function Pad({ setFabricObject, fabricObjects, brushColor }: Props) {
  const padRef = React.useRef<HTMLDivElement>();
  const canvasRef = React.useRef<fabric.Canvas>();

  React.useEffect(() => {
    const padElem = padRef.current;
    const canvasElem = padElem.querySelector<HTMLCanvasElement>(".Pad_canvas");
    canvasRef.current = new fabric.Canvas(canvasElem, {
      isDrawingMode: setFabricObject != null,
      width: padElem.clientWidth,
      height: padElem.clientHeight,
    });

    canvasRef.current.freeDrawingBrush.width = 3;
    canvasRef.current.freeDrawingBrush.color = brushColor || "Black";

    canvasRef.current.on("path:created", () => {
      setFabricObject(canvasRef.current.toObject());
    });

    window.addEventListener("resize", onResize);

    if (fabricObjects != null) {
      fabricObjects.objects.forEach((o) => {
        o.selectable = false;
        o.hoverCursor = "auto";
      });
      canvasRef.current.loadFromJSON(fabricObjects, () => {});
      fitCanvasToObjects(canvasRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  React.useEffect(() => {
    canvasRef.current.freeDrawingBrush.color = brushColor;
  }, [brushColor]);

  React.useEffect(() => {
    canvasRef.current.loadFromJSON(fabricObjects, () => {});
  }, [JSON.stringify(fabricObjects)]);

  function onResize() {
    const padElem = document.querySelector(".Pad");

    canvasRef.current.setDimensions({
      width: padElem.clientWidth,
      height: padElem.clientHeight,
    });
  }

  function fitCanvasToObjects(canvas: fabric.Canvas) {
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
