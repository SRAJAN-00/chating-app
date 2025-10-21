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

  const drawResizeHandles = (
    ctx: CanvasRenderingContext2D,
    shape: DrawingData
  ) => {
    const handleSize = 8;
    const x = shape.x;
    const y = shape.y;
    const width = Math.abs((shape.endX || shape.x) - shape.x);
    const height = Math.abs((shape.endY || shape.y) - shape.y);

    const handles = [
      { x: x, y: y }, // Top-left
      { x: x + width, y: y }, // Top-right
      { x: x, y: y + height }, // Bottom-left
      { x: x + width, y: y + height }, // Bottom-right
      { x: x + width / 2, y: y }, // Mid-top
      { x: x, y: y + height / 2 }, // Mid-left
      { x: x + width, y: y + height / 2 }, // Mid-right
      { x: x + width / 2, y: y + height }, // Mid-bottom
    ];

    ctx.fillStyle = "blue";
    handles.forEach((handle) => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });

    return handles;
  };

  const checkHandleClick = (
    point: { x: number; y: number },
    handles: { x: number; y: number }[]
  ) => {
    return handles.findIndex(
      (handle: { x: number; y: number }) =>
        point.x >= handle.x - 4 &&
        point.x <= handle.x + 4 &&
        point.y >= handle.y - 4 &&
        point.y <= handle.y + 4
    );
  };

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

  const updateResize = (
    currentPoint: { x: number; y: number },
    onUpdate: (updatedShape: DrawingData) => void
  ) => {
    if (
      !isResizing ||
      selectedHandleIndex === null ||
      resizingShapeIndex === null ||
      !originalResizeShape
    ) {
      return;
    }

    let newX = originalResizeShape.x;
    let newY = originalResizeShape.y;
    let newEndX = originalResizeShape.endX || originalResizeShape.x;
    let newEndY = originalResizeShape.endY || originalResizeShape.y;

    // Update coordinates based on which handle is being dragged
    if (selectedHandleIndex === 0) {
      // Top-left handle
      newX = currentPoint.x;
      newY = currentPoint.y;
    } else if (selectedHandleIndex === 1) {
      // Top-right handle
      newEndX = currentPoint.x;
      newY = currentPoint.y;
    } else if (selectedHandleIndex === 2) {
      // Bottom-left handle
      newX = currentPoint.x;
      newEndY = currentPoint.y;
    } else if (selectedHandleIndex === 3) {
      // Bottom-right handle
      newEndX = currentPoint.x;
      newEndY = currentPoint.y;
    }

    const updatedShape = {
      ...stroke[resizingShapeIndex],
      x: Math.min(newX, newEndX),
      y: Math.min(newY, newEndY),
      endX: Math.max(newX, newEndX),
      endY: Math.max(newY, newEndY),
    };

    onUpdate(updatedShape);
  };

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
    setIsResizing,
    setSelectedHandleIndex,
    setResizingShapeIndex,
    setOriginalResizeShape,
    setResizeStartPoint,
  };
};
