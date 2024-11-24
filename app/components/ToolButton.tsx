import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

type Props = { active?: boolean } & ComponentPropsWithoutRef<"button">;

export default function ToolButton({
  active = false,
  className,
  ...props
}: Props) {
  const mergedClassName = twMerge(
    "btn btn-sm rounded-none",
    active ? "btn-active" : "",
    className
  );
  return <button {...props} className={mergedClassName}></button>;
}
