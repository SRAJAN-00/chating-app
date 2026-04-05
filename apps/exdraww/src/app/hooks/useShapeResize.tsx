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

type ResizeHandle = {
  x: number;
  y: number;
};

export const useShapeResize = (stroke: DrawingData[]) => {
  const [isResizing, setIsResizing] = useState(false);
  const [selectedHandleIndex, setSelectedHandleIndex] = useState<number | null>(
    null,
  );
  const [resizingShapeIndex, setResizingShapeIndex] = useState<number | null>(
    null,
  );
  const [originalResizeShape, setOriginalResizeShape] =
    useState<ShapePosition | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previewResizedShape, setPreviewResizedShape] =
    useState<DrawingData | null>(null);
  const [lastResizedShape, setLastResizedShape] = useState<DrawingData | null>(
    null,
  );

  const handleSize = 10;
  const clickTolerance = handleSize / 2; // 5 pixels

  /** ---------------------------------------------------------
   * 🟦 Compute resize handles for rectangles and circles
   * --------------------------------------------------------- */
  const getResizeHandles = (shape: DrawingData): ResizeHandle[] => {
    if (shape.tool === "circle") {
      const centerX = shape.x;
      const centerY = shape.y;
      const endX = shape.endX ?? shape.x;
      const endY = shape.endY ?? shape.y;
      const radius = Math.max(
        Math.hypot(endX - centerX, endY - centerY),
        10,
      );
      const handleRadius = radius;
      const angles = [
        (3 * Math.PI) / 2, // top
        0, // right
        Math.PI / 2, // bottom
        Math.PI, // left
      ];

      return angles.map((angle) => ({
        x: centerX + handleRadius * Math.cos(angle),
        y: centerY + handleRadius * Math.sin(angle),
      }));
    }

    const minX = Math.min(shape.x, shape.endX ?? shape.x);
    const maxX = Math.max(shape.x, shape.endX ?? shape.x);
    const minY = Math.min(shape.y, shape.endY ?? shape.y);
    const maxY = Math.max(shape.y, shape.endY ?? shape.y);

    const width = maxX - minX;
    const height = maxY - minY;

    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: minX, y: maxY },
      { x: maxX, y: maxY },
      { x: minX + width / 2, y: minY },
      { x: minX, y: minY + height / 2 },
      { x: maxX, y: minY + height / 2 },
      { x: minX + width / 2, y: maxY },
    ];
  };

  /** ---------------------------------------------------------
   * 🟦 Draw resize handles for rectangles and circles
   * --------------------------------------------------------- */
  const drawResizeHandles = (
    ctx: CanvasRenderingContext2D,
    shape: DrawingData,
  ) => {
    const handles = getResizeHandles(shape);
    ctx.save();
    ctx.fillStyle = "#007bff";
    handles.forEach((handle) => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize,
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
    handles: { x: number; y: number }[],
  ) => {
    return handles.findIndex(
      (handle) =>
        point.x >= handle.x - clickTolerance &&
        point.x <= handle.x + clickTolerance &&
        point.y >= handle.y - clickTolerance &&
        point.y <= handle.y + clickTolerance,
    );
  };

  /** ---------------------------------------------------------
   * 🟨 Start resizing
   * --------------------------------------------------------- */
  const startResize = (
    handleIndex: number,
    shapeIndex: number,
    shape: DrawingData,
    startPoint: { x: number; y: number },
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
  const updateResize = (currentPoint: { x: number; y: number }) => {
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
      const startX = originalResizeShape.x;
      const startY = originalResizeShape.y;
      const startEndX = originalResizeShape.endX || originalResizeShape.x;
      const startEndY = originalResizeShape.endY || originalResizeShape.y;
      const minX = Math.min(startX, startEndX);
      const maxX = Math.max(startX, startEndX);
      const minY = Math.min(startY, startEndY);
      const maxY = Math.max(startY, startEndY);

      let finalX = minX;
      let finalY = minY;
      let finalEndX = maxX;
      let finalEndY = maxY;

      // Anchor-based rectangle resize: opposite side/corner stays fixed.
      if (selectedHandleIndex === 0) {
        finalEndX = maxX;
        finalEndY = maxY;
        finalX = Math.min(currentPoint.x, finalEndX);
        finalY = Math.min(currentPoint.y, finalEndY);
      } else if (selectedHandleIndex === 1) {
        finalX = minX;
        finalEndY = maxY;
        finalEndX = Math.max(currentPoint.x, finalX);
        finalY = Math.min(currentPoint.y, finalEndY);
      } else if (selectedHandleIndex === 2) {
        finalEndX = maxX;
        finalY = minY;
        finalX = Math.min(currentPoint.x, finalEndX);
        finalEndY = Math.max(currentPoint.y, finalY);
      } else if (selectedHandleIndex === 3) {
        finalX = minX;
        finalY = minY;
        finalEndX = Math.max(currentPoint.x, finalX);
        finalEndY = Math.max(currentPoint.y, finalY);
      } else if (selectedHandleIndex === 4) {
        // top-center
        finalX = minX;
        finalEndX = maxX;
        finalEndY = maxY;
        finalY = Math.min(currentPoint.y, finalEndY);
      } else if (selectedHandleIndex === 5) {
        // left-center
        finalY = minY;
        finalEndY = maxY;
        finalEndX = maxX;
        finalX = Math.min(currentPoint.x, finalEndX);
      } else if (selectedHandleIndex === 6) {
        // right-center
        finalX = minX;
        finalY = minY;
        finalEndY = maxY;
        finalEndX = Math.max(currentPoint.x, finalX);
      } else if (selectedHandleIndex === 7) {
        // bottom-center
        finalX = minX;
        finalY = minY;
        finalEndX = maxX;
        finalEndY = Math.max(currentPoint.y, finalY);
      }

      const minSize = 20;
      const width = finalEndX - finalX;
      const height = finalEndY - finalY;

      // Clamp instead of freezing when below minimum size.
      if (width < minSize) {
        if ([0, 2, 5].includes(selectedHandleIndex)) {
          finalX = finalEndX - minSize;
        } else if ([1, 3, 6].includes(selectedHandleIndex)) {
          finalEndX = finalX + minSize;
        } else {
          finalEndX = finalX + minSize;
        }
      }

      if (height < minSize) {
        if ([0, 1, 4].includes(selectedHandleIndex)) {
          finalY = finalEndY - minSize;
        } else if ([2, 3, 7].includes(selectedHandleIndex)) {
          finalEndY = finalY + minSize;
        } else {
          finalEndY = finalY + minSize;
        }
      }

      const updatedShape = {
        ...shape,
        x: finalX,
        y: finalY,
        endX: finalEndX,
        endY: finalEndY,
      };

      setPreviewResizedShape(updatedShape);
      setLastResizedShape(updatedShape);
      return;
    }

    // 🔵 Circle resizing
    const centerX = originalResizeShape.x;
    const centerY = originalResizeShape.y;
    const minRadius = 10;
    let nextEndX = originalResizeShape.endX ?? centerX;
    let nextEndY = originalResizeShape.endY ?? centerY;

    // Circle-native 4 handles: top, right, bottom, left (center-anchored).
    if (selectedHandleIndex === 0) {
      // top
      nextEndX = centerX;
      nextEndY = Math.min(currentPoint.y, centerY - minRadius);
    } else if (selectedHandleIndex === 1) {
      // right
      nextEndY = centerY;
      nextEndX = Math.max(currentPoint.x, centerX + minRadius);
    } else if (selectedHandleIndex === 2) {
      // bottom
      nextEndX = centerX;
      nextEndY = Math.max(currentPoint.y, centerY + minRadius);
    } else if (selectedHandleIndex === 3) {
      // left
      nextEndY = centerY;
      nextEndX = Math.min(currentPoint.x, centerX - minRadius);
    }

    const updatedShape = {
      ...shape,
      x: centerX,
      y: centerY,
      endX: nextEndX,
      endY: nextEndY,
    };

    setPreviewResizedShape(updatedShape);
    setLastResizedShape(updatedShape);
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
    setPreviewResizedShape(null);
    setLastResizedShape(null);
  };

  return {
    isResizing,
    selectedHandleIndex,
    resizingShapeIndex,
    originalResizeShape,
    resizeStartPoint,
    previewResizedShape,
    lastResizedShape,
    getResizeHandles,
    drawResizeHandles,
    checkHandleClick,
    startResize,
    updateResize,
    endResize,
  };
};
