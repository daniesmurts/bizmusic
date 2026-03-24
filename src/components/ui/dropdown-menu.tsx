"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used within a DropdownMenu");

  return (
    <div 
      onClick={() => context.setIsOpen(!context.isOpen)}
      className="cursor-pointer"
    >
      {children}
    </div>
  );
};

export const DropdownMenuContent = ({ children, align = "end", className }: any) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuContent must be used within a DropdownMenu");

  if (!context.isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => context.setIsOpen(false)} 
      />
      <div className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-white/10 bg-[#0A0A0A] p-1 text-popover-foreground shadow-md animate-in fade-in-80 scale-95 origin-top-right",
        align === "end" ? "right-0" : "left-0",
        className
      )}>
        {children}
      </div>
    </>
  );
};

export const DropdownMenuItem = ({ children, onClick, className }: any) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuItem must be used within a DropdownMenu");

  return (
    <button
      onClick={(e) => {
        onClick?.(e);
        context.setIsOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-white/5 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
};
