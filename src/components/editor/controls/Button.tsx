import { motion } from "framer-motion";
import type { ControlMapping } from "@/types/mode";

interface ButtonProps {
  id: string;
  cc: number;
  ledColor: "led-green" | "primary";
  isSelected: boolean;
  control: ControlMapping | undefined;
  onSelect: (id: string) => void;
  onLabelUpdate: (id: string, newLabel: string) => void;
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  onEditCancel: () => void;
}

export const Button = ({
  id,
  cc,
  ledColor,
  isSelected,
  control,
  onSelect,
  onLabelUpdate,
  isEditing,
  editValue,
  onEditChange,
  onEditStart,
  onEditEnd,
  onEditCancel,
}: ButtonProps) => {
  const defaultLabel = `Button ${cc}`;
  const label = control?.label || defaultLabel;
  const isNonDefault = control?.label && control.label !== defaultLabel;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onLabelUpdate(id, editValue);
      onEditEnd();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Button */}
      <motion.button
        onClick={() => onSelect(id)}
        className={`relative w-16 h-8 rounded-full transition-all duration-200 border-2 ${
          isSelected
            ? `bg-hardware-${ledColor} border-${ledColor} shadow-glow-primary`
            : "bg-hardware-button border-border hover:border-primary/50"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* LED Indicator */}
        <div
          className={`absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-${ledColor} ${
            isSelected ? "animate-pulse" : ""
          }`}
        />
      </motion.button>

      {/* CC Number */}
      <div className="text-xs text-muted-foreground font-medium">
        CC {cc}
      </div>

      {/* Label */}
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onEditEnd}
          autoFocus
          className="w-20 text-xs text-center bg-background border border-primary rounded px-1 py-0.5"
        />
      ) : (
        <div
          onDoubleClick={onEditStart}
          className={`text-xs font-semibold cursor-pointer hover:text-primary transition-colors text-center ${
            isNonDefault ? "text-green-500" : "text-foreground"
          }`}
        >
          {label}
        </div>
      )}
    </div>
  );
};
