import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Direction the element travels in from */
  from?: "up" | "left" | "right" | "none";
  as?: "div" | "section" | "span";
};

/**
 * Subtle scroll-reveal wrapper. Animates once when the element enters
 * the viewport, and respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  const offset =
    from === "left" ? { x: -28, y: 0 } : from === "right" ? { x: 28, y: 0 } : from === "none" ? { x: 0, y: 0 } : { x: 0, y: 28 };

  if (reduced) {
    return <MotionTag className={className}>{children}</MotionTag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
