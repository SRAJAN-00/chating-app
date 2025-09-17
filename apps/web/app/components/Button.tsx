import { ReactNode, MouseEventHandler } from "react";

type CustomButtonProps = {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: "blue" | "green" | "gray";
};
export default function Button({
  children,
  onClick,
  variant = "blue",
}: CustomButtonProps) {
  const baseClasses = `
    font-bold
    py-2
    px-6
    rounded-lg
    transition
    duration-300
    relative
    focus:outline-none
    flex
    items-center
    justify-center
  `;

  const variants = {
    blue: "bg-blue-500 text-white hover:bg-blue-600",
    green: "bg-green-500 text-ne hover:bg-green-600",
    gray: "bg-neutral-700 text-neutral-100 hover:bg-gray-800",
  };

  // Smooth shadows using style attribute
  const shadowStyle = {
    boxShadow:
      "inset 0 2px 6px rgba(0,0,0,0.3), /* inner shadow */" +
      "" /* outer top/bottom shadow */,
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]}`}
      style={shadowStyle}
    >
      {children}
    </button>
  );
}
