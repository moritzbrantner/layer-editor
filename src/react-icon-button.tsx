"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@moritzbrantner/ui";
import type { MouseEvent, ReactNode } from "react";

export function IconButton({
  children,
  disabled,
  label,
  onClick,
  tooltip,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="mb-layer-editor__icon-button"
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
