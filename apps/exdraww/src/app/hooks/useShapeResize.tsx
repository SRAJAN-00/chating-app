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

  const handleSize = 10;
  const clickTolerance = handleSize / 2; // 5 pixels

  /** ---------------------------------------------------------
   * 🟦 Draw resize handles for rectangles and circles
   * --------------------------------------------------------- */
  const drawResizeHandles = (
    ctx: CanvasRenderingContext2D,
    shape: DrawingData
  ) => {
    const minX = Math.min(shape.x, shape.endX ?? shape.x);
    const maxX = Math.max(shape.x, shape.endX ?? shape.x);
    const minY = Math.min(shape.y, shape.endY ?? shape.y);
    const maxY = Math.max(shape.y, shape.endY ?? shape.y);

    const width = maxX - minX;
    const height = maxY - minY;

    let handles;

    // ✅ CIRCLE HANDLES (8 handles positioned OUTSIDE the circle)
    if (shape.tool === "circle") {
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const radiusX = (maxX - minX) / 2;
      const radiusY = (maxY - minY) / 2;
      const offset = 12; // Push handles outside the circle

      // Calculate positions outside the circle/ellipse
      const cornerOffset = offset * Math.sqrt(2) / 2; // Diagonal offset for corners
      
      // 8 handles: 4 corners + 4 edges positioned outside the circle
      handles = [
        { x: minX - cornerOffset, y: minY - cornerOffset }, // top-left corner (outside)
        { x: maxX + cornerOffset, y: minY - cornerOffset }, // top-right corner (outside)
        { x: minX - cornerOffset, y: maxY + cornerOffset }, // bottom-left corner (outside)
        { x: maxX + cornerOffset, y: maxY + cornerOffset }, // bottom-right corner (outside)
        { x: centerX, y: minY - offset }, // top-center edge (outside)
        { x: minX - offset, y: centerY }, // left-center edge (outside)
        { x: maxX + offset, y: centerY }, // right-center edge (outside)
        { x: centerX, y: maxY + offset }, // bottom-center edge (outside)
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
        point.x >= handle.x - clickTolerance &&
        point.x <= handle.x + clickTolerance &&
        point.y >= handle.y - clickTolerance &&
        point.y <= handle.y + clickTolerance
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

      // Corner handles (0-3)
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
      // Edge handles (4-7)
      else if (selectedHandleIndex === 4) {
        // top-center - only move Y
        newY = currentPoint.y;
      } else if (selectedHandleIndex === 5) {
        // left-center - only move X
        newX = currentPoint.x;
      } else if (selectedHandleIndex === 6) {
        // right-center - only move X
        newEndX = currentPoint.x;
      } else if (selectedHandleIndex === 7) {
        // bottom-center - only move Y
        newEndY = currentPoint.y;
      }

      // Add minimum size protection
      const minSize = 20;
      const finalX = Math.min(newX, newEndX);
      const finalY = Math.min(newY, newEndY);
      const finalEndX = Math.max(newX, newEndX);
      const finalEndY = Math.max(newY, newEndY);

      // Check minimum size constraints
      if (Math.abs(finalEndX - finalX) < minSize || Math.abs(finalEndY - finalY) < minSize) {
        return; // Don't update if too small
      }

      const updatedShape = {
        ...shape,
        x: finalX,
        y: finalY,
        endX: finalEndX,
        endY: finalEndY,
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

    // Handle all 8 circle handles like a rectangle (allows elliptical shapes)
    if (selectedHandleIndex === 0) {
      // Top-left corner
      newRadiusX = Math.max(Math.abs(currentPoint.x - centerX), 10);
      newRadiusY = Math.max(Math.abs(currentPoint.y - centerY), 10);
    } else if (selectedHandleIndex === 1) {
      // Top-right corner
      newRadiusX = Math.max(Math.abs(currentPoint.x - centerX), 10);
      newRadiusY = Math.max(Math.abs(currentPoint.y - centerY), 10);
    } else if (selectedHandleIndex === 2) {
      // Bottom-left corner
      newRadiusX = Math.max(Math.abs(currentPoint.x - centerX), 10);
      newRadiusY = Math.max(Math.abs(currentPoint.y - centerY), 10);
    } else if (selectedHandleIndex === 3) {
      // Bottom-right corner
      newRadiusX = Math.max(Math.abs(currentPoint.x - centerX), 10);
      newRadiusY = Math.max(Math.abs(currentPoint.y - centerY), 10);
    } else if (selectedHandleIndex === 4) {
      // Top-center edge - only resize Y
      newRadiusY = Math.max(Math.abs(currentPoint.y - centerY), 10);
    } else if (selectedHandleIndex === 5) {
      // Left-center edge - only resize X
      newRadiusX = Math.max(Math.abs(currentPoint.x - centerX), 10);
    } else if (selectedHandleIndex === 6) {
      // Right-center edge - only resize X
      newRadiusX = Math.max(Math.abs(currentPoint.x - centerX), 10);
    } else if (selectedHandleIndex === 7) {
      // Bottom-center edge - only resize Y
      newRadiusY = Math.max(Math.abs(currentPoint.y - centerY), 10);
    }

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
