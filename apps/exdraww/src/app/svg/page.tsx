"use client";
import React, { useState } from "react";
import { motion } from "motion/react";

const PulsingLine = () => {
  const width = window.innerWidth; // 80% of viewport width
  const height = 80;

  const [isHovered, setIsHovered] = useState(false);

  const path = "M0 40 H${width}";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#fff",
      }}
    >
      <motion.svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        onHoverStart={() => setIsHovered(true)} // when mouse enters
        onHoverEnd={() => setIsHovered(false)} // when mouse leaves
        style={{ cursor: "pointer" }}
      >
        {/* background line */}
        <path d={path} stroke="black" strokeOpacity="0.2" />

        {/* main animated line */}
        <path
          d={path}
          stroke="url(#pulse-1)"
          strokeLinecap="round"
          strokeWidth="2"
        />

        {/* gradient definition with conditional animation */}
        <defs>
          <motion.linearGradient
            id="pulse-1"
            gradientUnits="userSpaceOnUse"
            animate={
              isHovered
                ? {
                    x1: [0, width * 2],
                    x2: [0, width],
                    y1: [height, height / 2],
                    y2: [height * 2, height],
                  }
                : {
                    x1: 0,
                    x2: 0,
                    y1: height,
                    y2: height,
                  }
            }
            transition={
              isHovered
                ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }
                : { duration: 0.3 }
            }
          >
            <stop stopColor="#2EB9DF" stopOpacity="0" />
            <stop stopColor="#2EB9DF" />
            <stop offset="1" stopColor="#9E00FF" stopOpacity="0" />
          </motion.linearGradient>
        </defs>
      </motion.svg>
      {/* <button
        style={{
          position: "absolute",
          top: "48%", // distance from top of SVG
          left: "50%", // horizontally centered
          transform: "translateX(-50%)",
          backgroundColor: "#9E00FF",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Hover Me
      </button> */}
    </div>
  );
};

export default PulsingLine;
