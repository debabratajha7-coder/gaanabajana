"use client";

import {
  AnnotatedText,
  type AnnotationVariant,
} from "@/components/ui/annotated-text";

/**
 * Wrap the first case-insensitive match of `phrase` in AnnotatedText.
 * Renders plain text if the phrase isn't found.
 */
export function AnnotatedPhrase({
  text,
  phrase,
  variant = "wavy",
  color = "text-[var(--accent)]",
  delay = 0.25,
  duration = 0.7,
  className,
}: {
  text: string;
  phrase: string;
  variant?: AnnotationVariant;
  color?: string;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const lower = text.toLowerCase();
  const needle = phrase.toLowerCase();
  const at = lower.indexOf(needle);

  if (at === -1) return <>{text}</>;

  const before = text.slice(0, at);
  const match = text.slice(at, at + phrase.length);
  const after = text.slice(at + phrase.length);

  return (
    <>
      {before}
      <AnnotatedText
        variant={variant}
        color={color}
        delay={delay}
        duration={duration}
        className={className}
      >
        {match}
      </AnnotatedText>
      {after}
    </>
  );
}
