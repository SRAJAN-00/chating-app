import React from "react";

const RectangleIcon = ({
  width = 30,
  height = 30,
  strokeWidth = 2,
  color = "currentColor",
  className = "",
}: {
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon icon-tabler icon-tabler-rectangle ${className}`}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
    </svg>
  );
};

export default RectangleIcon;
