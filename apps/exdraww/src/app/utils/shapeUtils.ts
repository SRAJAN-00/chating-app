type DrawingData = {
  x: number;
  y: number;
  color: string;
  size: number;
  endX?: number;
  endY?: number;
  tool?: string;
};

// ...existing code...

export const drawArrowhead = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  arrowSize: number
) => {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowSize * Math.cos(angle - Math.PI / 6),
    toY - arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowSize * Math.cos(angle + Math.PI / 6),
    toY - arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
};

export const getShapeBounds = (shape: DrawingData) => {
  if (shape.tool === "rectangle" || shape.tool === "arrow") {
    const minX = Math.min(shape.x, shape.endX || shape.x);
    const maxX = Math.max(shape.x, shape.endX || shape.x);
    const minY = Math.min(shape.y, shape.endY || shape.y);
    const maxY = Math.max(shape.y, shape.endY || shape.y);
    return { minX, maxX, minY, maxY };
  }

  if (shape.tool === "circle") {
    const centerX = shape.x;
    const centerY = shape.y;
    const radius = Math.sqrt(
      Math.pow((shape.endX || shape.x) - shape.x, 2) +
        Math.pow((shape.endY || shape.y) - shape.y, 2)
    );

    return {
      minX: centerX - radius,
      maxX: centerX + radius,
      minY: centerY - radius,
      maxY: centerY + radius,
    };
  }

  // Default fallback for other shapes
  const minX = Math.min(shape.x, shape.endX || shape.x);
  const maxX = Math.max(shape.x, shape.endX || shape.x);
  const minY = Math.min(shape.y, shape.endY || shape.y);
  const maxY = Math.max(shape.y, shape.endY || shape.y);
  return { minX, maxX, minY, maxY };
};

export const isPointInShape = (
  point: { x: number; y: number },
  shape: DrawingData
) => {
  if (shape.tool === "rectangle") {
    const { minX, maxX, minY, maxY } = getShapeBounds(shape);
    return (
      point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
    );
  }

  if (shape.tool === "circle") {
    // Calculate if point is inside circle
    const centerX = shape.x;
    const centerY = shape.y;
    const radius = Math.sqrt(
      Math.pow((shape.endX || shape.x) - shape.x, 2) +
        Math.pow((shape.endY || shape.y) - shape.y, 2)
    );

    const distance = Math.sqrt(
      Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
    );

    return distance <= radius;
  }

  if (shape.tool === "arrow") {
    // For arrows, check if point is near the line (with some tolerance)
    const tolerance = Math.max(shape.size || 1, 5); // Use stroke size or minimum 5px

    // Calculate distance from point to line
    const x1 = shape.x;
    const y1 = shape.y;
    const x2 = shape.endX || shape.x;
    const y2 = shape.endY || shape.y;

    // Distance from point to line formula
    const A = point.x - x1;
    const B = point.y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return false; // Line has no length

    let param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= tolerance;
  }

  // For pen strokes or unknown shapes, return false for now
  return false;
};

export const getMousePoint = (
  e: React.MouseEvent,
  canvas: HTMLCanvasElement | null
): { x: number; y: number } | null => {
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};
