import { useState } from "react";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number; // Optional - only for shapes
  endY?: number; // Optional - only for shapes
  tool?: string; // Optional - pen, rectangle, etc.
};

// Define the type for originalShapePosition
interface ShapePosition {
  x: number;
  y: number;
  endX?: number;
  endY?: number;
}
// hooks/useShapeSelection.ts
export const useShapeSelection = (stroke: DrawingData[]) => {
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, y: 0 });
  const [originalShapePosition, setOriginalShapePosition] =
    useState<ShapePosition | null>(null);

  const findShapeAtPoint = (x: number, y: number): number | null => {
    // Check from end to start (top rectangle first)
    for (let i = stroke.length - 1; i >= 0; i--) {
      const shape = stroke[i];

      if (shape.tool === "rectangle") {
        const minX = Math.min(shape.x, shape.endX || shape.x);
        const maxX = Math.max(shape.x, shape.endX || shape.x);
        const minY = Math.min(shape.y, shape.endY || shape.y);
        const maxY = Math.max(shape.y, shape.endY || shape.y);

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return i;
        }
      }
      if (shape.tool === "circle") {
        const centerX = (shape.x + (shape.endX || shape.x)) / 2;
        const centerY = (shape.y + (shape.endY || shape.y)) / 2;
        const radiusX = Math.abs((shape.endX || shape.x) - shape.x) / 2;
        const radiusY = Math.abs((shape.endY || shape.y) - shape.y) / 2;

        const normalizedX = x - centerX;
        const normalizedY = y - centerY;

        if (
          (normalizedX * normalizedX) / (radiusX * radiusX) +
            (normalizedY * normalizedY) / (radiusY * radiusY) <=
          1
        ) {
          return i;
        }
      }
    }
    return null;
  };

  const startDrag = (
    shapeIndex: number,
    startPoint: { x: number; y: number }
  ) => {
    setSelectedShapeIndex(shapeIndex);
    setIsDragging(true);
    setDragStartPoint(startPoint);

    // Save original position
    const shape = stroke[shapeIndex];
    setOriginalShapePosition({
      x: shape.x,
      y: shape.y,
      endX: shape.endX,
      endY: shape.endY,
    });
  };

  const updateDrag = (
    currentPoint: { x: number; y: number },
    onUpdate: (dragInfo: {
      newX: number;
      newY: number;
      newEndX: number;
      newEndY: number;
    }) => void
  ) => {
    if (!isDragging || selectedShapeIndex === null || !originalShapePosition) {
      return;
    }

    const dragOffset = {
      x: currentPoint.x - dragStartPoint.x,
      y: currentPoint.y - dragStartPoint.y,
    };

    const newX = originalShapePosition.x + dragOffset.x;
    const newY = originalShapePosition.y + dragOffset.y;
    const newEndX =
      (originalShapePosition.endX || originalShapePosition.x) + dragOffset.x;
    const newEndY =
      (originalShapePosition.endY || originalShapePosition.y) + dragOffset.y;

    // Call the update callback with the new position
    onUpdate({ newX, newY, newEndX, newEndY });
  };

  const endDrag = () => {
    setIsDragging(false);
    setOriginalShapePosition(null);
  };

  const selectShape = (shapeIndex: number | null) => {
    setSelectedShapeIndex(shapeIndex);
  };

  const clearSelection = () => {
    setSelectedShapeIndex(null);
    setIsDragging(false);
    setOriginalShapePosition(null);
  };

  return {
    selectedShapeIndex,
    isDragging,
    dragStartPoint,
    originalShapePosition,
    findShapeAtPoint,
    startDrag,
    updateDrag,
    endDrag,
    selectShape,
    clearSelection,
    setSelectedShapeIndex,
    setIsDragging,
    setDragStartPoint,
    setOriginalShapePosition,
  };
};
