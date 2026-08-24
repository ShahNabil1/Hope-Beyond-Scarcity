import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

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
 * Safety: the content is *always* revealed after a short timeout, so a missed
 * IntersectionObserver callback (slow hydration, restored scroll position,
 * background tab) can never leave a section permanently invisible.
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
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.2, margin: "0px 0px -80px 0px" });
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForced(true), 1200);
    return () => clearTimeout(timer);
  }, []);

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

  const show = inView || forced;

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={show ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration: 0.7, delay: show && !inView ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
