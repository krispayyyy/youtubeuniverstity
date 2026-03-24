"use client";

import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

/** Lucide `video` paths — rectangle + side beam (reads as “clip” / YouTube-adjacent). */
const VIDEO_PATHS = (
  <>
    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </>
);

export interface VideoIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface VideoIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const VideoIcon = forwardRef<VideoIconHandle, VideoIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div className={cn(className)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
        <motion.svg
          animate={controls}
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transition={{
            duration: 0.42,
            repeat: 1,
          }}
          variants={{
            normal: { scale: 1 },
            animate: { scale: [1, 1.07, 1] },
          }}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          {VIDEO_PATHS}
        </motion.svg>
      </div>
    );
  }
);

VideoIcon.displayName = "VideoIcon";

export { VideoIcon };
