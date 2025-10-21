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
  className,
  icon,
}: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-2  py-2 font-medium text-sm
        transition-all duration-300 ease-in-out
        
        focus:outline-none focus:ring-2 focus:ring-offset-2
        active:scale-95 transform
        ${isActive ? " bg-blue-500 rounded-xl " : "bg-transparent text-black"}
        ${className}
      `}
    >
      <div className="flex items-center justify-center gap-1.5">
        {icon && <span className="text-base">{icon}</span>}

        {isActive && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
        )}
      </div>
    </button>
  );
}
