import { useState } from "react";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

interface ShapePosition {
  x: number;
  y: number;
  endX?: number;
  endY?: number;
}

export const useShapeResize = (stroke: DrawingData[]) => {
  const [isResizing, setIsResizing] = useState(false);
  const [selectedHandleIndex, setSelectedHandleIndex] = useState<number | null>(
    null
  );
  const [resizingShapeIndex, setResizingShapeIndex] = useState<number | null>(
    null
  );
  const [originalResizeShape, setOriginalResizeShape] =
    useState<ShapePosition | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  /** ---------------------------------------------------------
   * 🟦 Draw resize handles for rectangles and circles
   * --------------------------------------------------------- */
  const drawResizeHandles = (
    ctx: CanvasRenderingContext2D,
    shape: DrawingData
  ) => {
    const handleSize = 10;
    const minX = Math.min(shape.x, shape.endX ?? shape.x);
    const maxX = Math.max(shape.x, shape.endX ?? shape.x);
    const minY = Math.min(shape.y, shape.endY ?? shape.y);
    const maxY = Math.max(shape.y, shape.endY ?? shape.y);

    const width = maxX - minX;
    const height = maxY - minY;

    let handles;

    // ✅ CIRCLE HANDLES (placed OUTSIDE)
    if (shape.tool === "circle") {
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const radiusX = (maxX - minX) / 2;
      const radiusY = (maxY - minY) / 2;
      const offset = 8; // push handles slightly outside

      handles = [
        { x: centerX, y: centerY - radiusY - offset }, // top
        { x: centerX, y: centerY + radiusY + offset }, // bottom
        { x: centerX - radiusX - offset, y: centerY }, // left
        { x: centerX + radiusX + offset, y: centerY }, // right
      ];

      ctx.save();
      ctx.fillStyle = "#007bff";
      handles.forEach((h) => {
        ctx.fillRect(
          h.x - handleSize / 2,
          h.y - handleSize / 2,
          handleSize,
          handleSize
        );
      });
      ctx.restore();

      return handles;
    }

    // 🟩 RECTANGLE HANDLES (8 total)
    handles = [
      { x: minX, y: minY }, // top-left
      { x: maxX, y: minY }, // top-right
      { x: minX, y: maxY }, // bottom-left
      { x: maxX, y: maxY }, // bottom-right
      { x: minX + width / 2, y: minY }, // top-center
      { x: minX, y: minY + height / 2 }, // left-center
      { x: maxX, y: minY + height / 2 }, // right-center
      { x: minX + width / 2, y: maxY }, // bottom-center
    ];

    ctx.save();
    ctx.fillStyle = "#007bff";
    handles.forEach((handle) => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
    ctx.restore();

    return handles;
  };

  /** ---------------------------------------------------------
   * 🔵 Check if user clicked a handle
   * --------------------------------------------------------- */
  const checkHandleClick = (
    point: { x: number; y: number },
    handles: { x: number; y: number }[]
  ) => {
    return handles.findIndex(
      (handle) =>
        point.x >= handle.x - 6 &&
        point.x <= handle.x + 6 &&
        point.y >= handle.y - 6 &&
        point.y <= handle.y + 6
    );
  };

  /** ---------------------------------------------------------
   * 🟨 Start resizing
   * --------------------------------------------------------- */
  const startResize = (
    handleIndex: number,
    shapeIndex: number,
    shape: DrawingData,
    startPoint: { x: number; y: number }
  ) => {
    setIsResizing(true);
    setSelectedHandleIndex(handleIndex);
    setResizingShapeIndex(shapeIndex);
    setResizeStartPoint(startPoint);
    setOriginalResizeShape({
      x: shape.x,
      y: shape.y,
      endX: shape.endX || shape.x,
      endY: shape.endY || shape.y,
    });
  };

  /** ---------------------------------------------------------
   * 🟣 Update resizing (circle + rectangle)
   * --------------------------------------------------------- */
  const updateResize = (
    currentPoint: { x: number; y: number },
    onUpdate: (updatedShape: DrawingData) => void
  ) => {
    if (
      !isResizing ||
      selectedHandleIndex === null ||
      resizingShapeIndex === null ||
      !originalResizeShape
    )
      return;

    const shape = stroke[resizingShapeIndex];

    // 🟩 Rectangle resizing
    if (shape.tool !== "circle") {
      let newX = originalResizeShape.x;
      let newY = originalResizeShape.y;
      let newEndX = originalResizeShape.endX || originalResizeShape.x;
      let newEndY = originalResizeShape.endY || originalResizeShape.y;

      if (selectedHandleIndex === 0) {
        newX = currentPoint.x;
        newY = currentPoint.y;
      } else if (selectedHandleIndex === 1) {
        newEndX = currentPoint.x;
        newY = currentPoint.y;
      } else if (selectedHandleIndex === 2) {
        newX = currentPoint.x;
        newEndY = currentPoint.y;
      } else if (selectedHandleIndex === 3) {
        newEndX = currentPoint.x;
        newEndY = currentPoint.y;
      }

      const updatedShape = {
        ...shape,
        x: Math.min(newX, newEndX),
        y: Math.min(newY, newEndY),
        endX: Math.max(newX, newEndX),
        endY: Math.max(newY, newEndY),
      };

      onUpdate(updatedShape);
      return;
    }

    // 🔵 Circle resizing
    let { x, y, endX, endY } = originalResizeShape;
    x = x ?? 0;
    y = y ?? 0;
    endX = endX ?? x;
    endY = endY ?? y;

    const centerX = (x + endX) / 2;
    const centerY = (y + endY) / 2;
    const radiusX = Math.abs(endX - x) / 2;
    const radiusY = Math.abs(endY - y) / 2;

    let newRadiusX = radiusX;
    let newRadiusY = radiusY;

    if (selectedHandleIndex === 0)
      newRadiusY = Math.abs(currentPoint.y - centerY);
    else if (selectedHandleIndex === 1)
      newRadiusY = Math.abs(currentPoint.y - centerY);
    else if (selectedHandleIndex === 2)
      newRadiusX = Math.abs(currentPoint.x - centerX);
    else if (selectedHandleIndex === 3)
      newRadiusX = Math.abs(currentPoint.x - centerX);

    const updatedShape = {
      ...shape,
      x: centerX - newRadiusX,
      y: centerY - newRadiusY,
      endX: centerX + newRadiusX,
      endY: centerY + newRadiusY,
    };

    onUpdate(updatedShape);
  };

  /** ---------------------------------------------------------
   * 🟥 End resizing
   * --------------------------------------------------------- */
  const endResize = () => {
    setIsResizing(false);
    setSelectedHandleIndex(null);
    setResizingShapeIndex(null);
    setOriginalResizeShape(null);
    setResizeStartPoint(null);
  };

  return {
    isResizing,
    selectedHandleIndex,
    resizingShapeIndex,
    originalResizeShape,
    resizeStartPoint,
    drawResizeHandles,
    checkHandleClick,
    startResize,
    updateResize,
    endResize,
  };
};
