"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export function GlobalCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const opacity = useMotionValue(1);

  // Smooth out the cursor trail
  const x = useSpring(mouseX, {
    stiffness: 400,
    damping: 28,
  });

  const y = useSpring(mouseY, {
    stiffness: 400,
    damping: 28,
  });

  useEffect(() => {
    // 1. Track global mouse moves
    const handleMouseMove = (e: MouseEvent) => {
      // Subtracting 10px to center a 20px wide circle on the precise cursor point
      mouseX.set(e.clientX - 10);
      mouseY.set(e.clientY - 10);
    };

    // 2. Hide/Show when mouse leaves or enters the browser window
    const handleMouseLeave = () => opacity.set(0);
    const handleMouseEnter = () => opacity.set(1);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, opacity]);

  return (
    <motion.div
      style={{ x, y }}
      className="
      fixed top-0 left-0
      size-5 rounded-full
      bg-black
      dark:bg-white
      pointer-events-none
      z-9999
    "
    />
  );
}
