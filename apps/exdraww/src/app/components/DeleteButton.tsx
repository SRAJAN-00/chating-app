import { useState, useEffect } from "react";

interface DeleteButtonProps {
  onDelete: (index: number) => void;
}

export default function DeleteButton({ onDelete }: DeleteButtonProps) {
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);

  // Listen for shape selection events (you'll need to implement this communication)
  useEffect(() => {
    const handleShapeSelection = (event: CustomEvent) => {
      setSelectedShapeIndex(event.detail.index);
    };

    const handleShapeDeselection = () => {
      setSelectedShapeIndex(null);
    };

    // Listen for custom events from the drawing board
    window.addEventListener('shape-selected', handleShapeSelection as EventListener);
    window.addEventListener('shape-deselected', handleShapeDeselection);

    return () => {
      window.removeEventListener('shape-selected', handleShapeSelection as EventListener);
      window.removeEventListener('shape-deselected', handleShapeDeselection);
    };
  }, []);

  // Don't show button if no shape is selected
  if (selectedShapeIndex === null) {
    return null;
  }

  const handleDeleteClick = () => {
    if (selectedShapeIndex !== null) {
      onDelete(selectedShapeIndex);
      setSelectedShapeIndex(null);
    }
  };

  return (
    <button
      onClick={handleDeleteClick}
      className="absolute top-20 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 z-10"
      title="Delete selected shape (Delete key)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Delete
    </button>
  );
}