"use client";

import { useRef, useCallback, useState, useLayoutEffect, useEffect } from "react";

// useLayoutEffect on server emits a warning — use useEffect as fallback during SSR
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import Lottie from "lottie-react";
import { useTheme } from "./ThemeProvider";

import heartAnimation from "@/data/heart-animation.json";

interface HeartLikeButtonProps {
  isLiked: boolean;
  trackId: string;
  onToggle: () => void;
  beforeToggle?: () => boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
  lottieVariant?: "light" | "dark" | "auto";
}

const SIZES = {
  sm: { btn: "w-6 h-6", svg: "w-3.5 h-3.5", lottie: 56 },
  md: { btn: "w-8 h-8", svg: "w-4 h-4", lottie: 72 },
  lg: { btn: "w-10 h-10", svg: "w-5 h-5", lottie: 88 },
};

const HEART_D = "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z";

export default function HeartLikeButton({
  isLiked,
  trackId,
  onToggle,
  beforeToggle,
  size = "md",
  className = "",
  iconClassName = "",
  disabled = false,
  ariaLabel,
  lottieVariant = "auto",
}: HeartLikeButtonProps) {
  const { theme } = useTheme();
  const resolvedVariant = lottieVariant === "auto"
    ? (theme === "dark" ? "light" : "dark")
    : lottieVariant;

  const btnRef = useRef<HTMLSpanElement>(null);
  const prevIsLikedRef = useRef(isLiked);
  const selfTriggeredRef = useRef(false);

  const [showLottie, setShowLottie] = useState(false);
  const [fillReady, setFillReady] = useState(false);
  const [externalFillAnim, setExternalFillAnim] = useState(false);

  const dims = SIZES[size];

  // Detect external transitions (not self-triggered)
  // useLayoutEffect runs BEFORE paint → no flash of filled heart before animation starts
  useIsomorphicLayoutEffect(() => {
    const wasLiked = prevIsLikedRef.current;
    prevIsLikedRef.current = isLiked;

    if (wasLiked === isLiked) return;

    // Unlike transition: true → false — INSTANT, no animation
    if (wasLiked && !isLiked) {
      setFillReady(false);
      setShowLottie(false);
      return;
    }

    // External like / undo: false → true, NOT self-triggered — fill from bottom
    if (!wasLiked && isLiked && !selfTriggeredRef.current) {
      setExternalFillAnim(true);
      setTimeout(() => setExternalFillAnim(false), 820);
    }

    selfTriggeredRef.current = false;
  }, [isLiked]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      if (beforeToggle && !beforeToggle()) return;

      // Self-triggered like — Lottie particles + delayed fill
      if (!isLiked) {
        selfTriggeredRef.current = true;
        setShowLottie(true);
        setFillReady(false);
        setTimeout(() => setFillReady(true), 400);
      }

      onToggle();
    },
    [isLiked, onToggle, disabled, beforeToggle]
  );

  // Should the filled heart path be visible?
  // - Self-click: visible after 0.4s delay (fillReady)
  // - External like/undo: visible during fill-up animation (externalFillAnim) OR after it completes (isLiked steady state)
  const isSteadyLiked = isLiked && !showLottie && !externalFillAnim;
  const showFill = (isLiked && fillReady) || isSteadyLiked || externalFillAnim;

  // Which animation class for the filled path?
  const fillAnimStyle: React.CSSProperties | undefined =
    externalFillAnim
      ? { animation: "heartFillUp 0.8s ease-out forwards" }
      : undefined;

  return (
    <span
      ref={btnRef}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel || (isLiked ? "Unlike" : "Like")}
      aria-disabled={disabled || undefined}
      className={`relative shrink-0 flex items-center justify-center cursor-pointer select-none ${dims.btn} ${className}`}
    >
      <svg className={`${dims.svg} ${iconClassName}`} viewBox="0 0 24 24">
        {/* Outline — always visible when not filled */}
        <path
          d={HEART_D}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: showFill && !externalFillAnim ? 0 : externalFillAnim ? 0.35 : 1 }}
        />
        {/* Filled overlay — with animation per transition type */}
        {showFill && (
          <path
            d={HEART_D}
            fill="currentColor"
            stroke="none"
            style={fillAnimStyle}
          />
        )}
      </svg>

      {/* Lottie particle burst */}
      {showLottie && (
        <span
          className={`absolute pointer-events-none z-10 ${resolvedVariant === "dark" ? "lottie-dark" : "lottie-light"}`}
          style={{
            width: dims.lottie,
            height: dims.lottie,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            overflow: "visible",
          }}
          aria-hidden="true"
        >
          <Lottie
            animationData={heartAnimation}
            loop={false}
            autoplay
            onComplete={() => setShowLottie(false)}
            style={{ width: "100%", height: "100%" }}
          />
        </span>
      )}
    </span>
  );
}
