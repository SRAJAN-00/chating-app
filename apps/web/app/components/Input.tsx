import React from "react";

type InputProps = {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
};

export function Input({
  type = "text",
  placeholder = "",
  value,
  onChange,
  className = "",
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={
        "px-4 py-2 rounded-lg border border-neutral-300 w-full focus:outline-none bg-inherit focus:ring-2 focus:ring-blue-400 text-lg " +
        className
      }
    />
  );
}
