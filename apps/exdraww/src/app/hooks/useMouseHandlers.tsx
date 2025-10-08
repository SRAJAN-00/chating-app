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

type Tool = "pen" | "rectangle" | "circle" | "arrow" | "select";

export const useMouseHandlers = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  selectedTool: Tool,
  shapeSelection: any,
  shapeResize: any,
  drawingTools: any,
  stroke: DrawingData[],
  onUpdateStroke?: (index: number, updatedStroke: DrawingData) => void
) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getMousePoint(e, canvasRef.current);
    if (!point) return;

    if (selectedTool === "select") {
      // Handle selection logic
      if (shapeSelection.selectedShapeIndex !== null) {
        const selectedShape = stroke[shapeSelection.selectedShapeIndex];
        const handles = shapeResize.drawResizeHandles(canvasRef.current?.getContext('2d')!, selectedShape);
        const handleIndex = shapeResize.checkHandleClick(point, handles);

        if (handleIndex !== -1) {
          shapeResize.startResize(handleIndex, shapeSelection.selectedShapeIndex, selectedShape, point);
          return;
        }
      }

      const shapeIndex = shapeSelection.findRectangleAtPoint(point.x, point.y);
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
    const point = getMousePoint(e, canvasRef.current);
    if (!point) return;

    // Handle resizing
    if (shapeResize.isResizing) {
      shapeResize.updateResize(point, (updatedShape: DrawingData) => {
        if (onUpdateStroke && shapeResize.resizingShapeIndex !== null) {
          onUpdateStroke(shapeResize.resizingShapeIndex, updatedShape);
        }
      });
      return;
    }

    // Handle dragging
    if (selectedTool === "select" && shapeSelection.isDragging) {
      shapeSelection.updateDrag(point, ({ newX, newY, newEndX, newEndY }: any) => {
        // Real-time drag visualization logic would go here
        // This could be extracted to another hook as well
      });
      return;
    }

    // Handle drawing tools
    drawingTools.handleMouseMove(point, selectedTool);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const point = getMousePoint(e, canvasRef.current);
    if (!point) return;

    // Handle resize completion
    if (shapeResize.isResizing) {
      shapeResize.endResize();
      return;
    }

    // Handle drag completion
    if (selectedTool === "select" && shapeSelection.isDragging) {
      if (shapeSelection.selectedShapeIndex !== null && shapeSelection.originalShapePosition) {
        const dragOffset = {
          x: point.x - shapeSelection.dragStartPoint.x,
          y: point.y - shapeSelection.dragStartPoint.y,
        };

        const newX = shapeSelection.originalShapePosition.x + dragOffset.x;
        const newY = shapeSelection.originalShapePosition.y + dragOffset.y;
        const newEndX = (shapeSelection.originalShapePosition.endX || shapeSelection.originalShapePosition.x) + dragOffset.x;
        const newEndY = (shapeSelection.originalShapePosition.endY || shapeSelection.originalShapePosition.y) + dragOffset.y;

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

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};