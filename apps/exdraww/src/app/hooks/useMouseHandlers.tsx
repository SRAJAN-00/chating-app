import { useState, useRef } from "react";
import { getMousePoint } from "../utils/shapeUtils";

type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

type Tool = "pen" | "rectangle" | "circle" | "arrow" | "select" | "text";

export const useMouseHandlers = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  selectedTool: Tool,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeSelection: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeResize: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drawingTools: any,
  stroke: DrawingData[],
  onUpdateStroke?: (index: number, updatedStroke: DrawingData) => void,
  onDeleteStroke?: (index: number) => void,
  onTextToolClick?: (x: number, y: number) => void,
) => {
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false); // Placeholder for panning state
  const prevPosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.ctrlKey) {
      // Start panning
      setIsPanning(true);
      prevPosition.current.x = e.clientX;
      prevPosition.current.y = e.clientY;
      return;
    }
    const point = getMousePoint(e, canvasRef.current, viewport);
    if (!point) return;

    // ✅ Optional: Add right-click delete
    if (e.button === 2 && selectedTool === "select") {
      // Right click
      const shapeIndex = shapeSelection.findShapeAtPoint(point.x, point.y);
      if (shapeIndex !== null && onDeleteStroke) {
        onDeleteStroke(shapeIndex);
        return;
      }
    }

    if (selectedTool === "text" && onTextToolClick && e.altKey) {
      // Show text input overlay at click position
      onTextToolClick(point.x, point.y);
      return;
    }
    if (selectedTool === "select") {
      // Handle selection logic
      if (shapeSelection.selectedShapeIndex !== null) {
        const selectedShape = stroke[shapeSelection.selectedShapeIndex];
        if (selectedShape) {
          const handles = shapeResize.getResizeHandles(selectedShape);
          const handleIndex = shapeResize.checkHandleClick(point, handles);

          if (handleIndex !== -1) {
            shapeResize.startResize(
              handleIndex,
              shapeSelection.selectedShapeIndex,
              selectedShape,
              point,
            );
            return;
          }
        }
      }

      const shapeIndex = shapeSelection.findShapeAtPoint(point.x, point.y);
      if (shapeIndex !== null) {
        shapeSelection.startDrag(shapeIndex, point);
      } else {
        shapeSelection.clearSelection();
      }
      return;
    }

    // Handle drawing tools
    drawingTools.handleMouseDown(point, selectedTool);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - prevPosition.current.x;
      const deltaY = e.clientY - prevPosition.current.y;
      setViewport((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
        scale: prev.scale,
      }));
      prevPosition.current.x = e.clientX;
      prevPosition.current.y = e.clientY;
      return;
    }
    const point = getMousePoint(e, canvasRef.current, viewport);
    if (!point) return;

    // Handle resizing
    if (shapeResize.isResizing) {
      shapeResize.updateResize(point);
      return;
    }

    // Handle dragging
    if (selectedTool === "select" && shapeSelection.isDragging) {
      shapeSelection.updateDrag(
        point,
        ({
          newX,
          newY,
          newEndX,
          newEndY,
        }: {
          newX: number;
          newY: number;
          newEndX: number;
          newEndY: number;
        }) => {
          // Preview is handled by updateDrag callback
          // The actual update happens on mouseUp
        },
      );
      return;
    }

    // Handle drawing tools
    drawingTools.handleMouseMove(point, selectedTool);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);

    // Handle resize completion first so mouse leave/up always exits resize mode.
    if (shapeResize.isResizing) {
      if (
        onUpdateStroke &&
        shapeResize.resizingShapeIndex !== null &&
        shapeResize.lastResizedShape
      ) {
        onUpdateStroke(shapeResize.resizingShapeIndex, shapeResize.lastResizedShape);
      }
      shapeResize.endResize();
      return;
    }

    const point = getMousePoint(e, canvasRef.current, viewport);
    if (!point) return;

    // Handle drag completion
    if (selectedTool === "select" && shapeSelection.isDragging) {
      if (
        shapeSelection.selectedShapeIndex !== null &&
        shapeSelection.originalShapePosition
      ) {
        const dragOffset = {
          x: point.x - shapeSelection.dragStartPoint.x,
          y: point.y - shapeSelection.dragStartPoint.y,
        };

        const newX = shapeSelection.originalShapePosition.x + dragOffset.x;
        const newY = shapeSelection.originalShapePosition.y + dragOffset.y;
        const newEndX =
          (shapeSelection.originalShapePosition.endX ||
            shapeSelection.originalShapePosition.x) + dragOffset.x;
        const newEndY =
          (shapeSelection.originalShapePosition.endY ||
            shapeSelection.originalShapePosition.y) + dragOffset.y;

        if (onUpdateStroke) {
          onUpdateStroke(shapeSelection.selectedShapeIndex, {
            ...stroke[shapeSelection.selectedShapeIndex],
            x: newX,
            y: newY,
            endX: newEndX,
            endY: newEndY,
          });
        }
      }

      shapeSelection.endDrag();
      return;
    }

    // Handle drawing tool completion
    drawingTools.handleMouseUp(point, selectedTool);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    setViewport((prev) => {
      const oldScale = prev.scale;
      const newScale =
        e.deltaY < 0 ? oldScale * scaleFactor : oldScale / scaleFactor;

      const clampedScale = Math.min(Math.max(newScale, 0.2), 5);

      const newX = mouseX - (mouseX - prev.x) * (clampedScale / oldScale);
      const newY = mouseY - (mouseY - prev.y) * (clampedScale / oldScale);

      return { x: newX, y: newY, scale: clampedScale };
    });
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    viewport,
  };
};
