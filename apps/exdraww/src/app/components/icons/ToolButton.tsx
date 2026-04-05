import { ReactElement } from "react";

interface ToolButtonProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: ReactElement;
}

export default function ToolButton({
  onClick,
  isActive,
  children,
  className = "",
  icon,
}: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-xl p-2
        transition-[color,background-color,box-shadow,transform] duration-150 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950
        ${isActive 
          ? "bg-violet-500/12 text-violet-900 shadow-sm ring-1 ring-violet-500/25 dark:bg-violet-400/10 dark:text-violet-100 dark:ring-violet-400/20" 
          : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"}
        ${className}
      `}
      title={children as string} // Tooltip
    >
      <div className="flex items-center justify-center">
        {icon && (
          <span className={`text-xl transition-transform duration-150 ${isActive ? "scale-105" : ""}`}>
            {icon}
          </span>
        )}
      </div>
    </button>
  );
}
