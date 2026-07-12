import { Text as RNText, type TextProps } from "react-native";

type Variant = "display" | "title" | "heading" | "body" | "label" | "caption";

const STYLES: Record<Variant, string> = {
  display: "text-ink text-4xl font-bold tracking-tight",
  title: "text-ink text-2xl font-bold tracking-tight",
  heading: "text-ink text-lg font-semibold",
  body: "text-ink text-base",
  label: "text-ink-muted text-sm font-medium",
  caption: "text-ink-faint text-xs",
};

export function Text({
  variant = "body",
  className = "",
  ...rest
}: TextProps & { variant?: Variant }) {
  return <RNText className={`${STYLES[variant]} ${className}`} {...rest} />;
}
