import { type ReactNode } from "react";
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
 *
 * Content is visible in the server HTML and before hydration. Motion is a
 * progressive enhancement only, so a slow script can never create a blank page.
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
  if (reduced) {
    return <MotionTag className={className}>{children}</MotionTag>;
  }

  const offset =
    from === "left"
      ? { x: -28, y: 0 }
      : from === "right"
        ? { x: 28, y: 0 }
        : from === "none"
          ? { x: 0, y: 0 }
          : { x: 0, y: 28 };

  return (
    <MotionTag
      className={className}
      initial={false}
      whileInView={{ opacity: [0.94, 1], x: [offset.x, 0], y: [offset.y, 0] }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
