import { useState } from "react";
import { motion } from "framer-motion";
import type { ControlMapping } from "@/types/mode";
import { Knob } from "@/components/editor/controls/Knob";
import { Fader } from "@/components/editor/controls/Fader";
import { Button } from "@/components/editor/controls/Button";

interface ControllerVisualProps {
  selectedControl: string | null;
  onControlSelect: (controlId: string) => void;
  controls: Record<string, ControlMapping>;
  onLabelUpdate: (controlId: string, newLabel: string) => void;
}

const ControllerVisual = ({
  selectedControl,
  onControlSelect,
  controls,
  onLabelUpdate,
}: ControllerVisualProps) => {
  const [editingControl, setEditingControl] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEditStart = (controlId: string) => {
    const currentLabel = controls[controlId]?.label || "";
    setEditingControl(controlId);
    setEditValue(currentLabel);
  };

  const handleEditEnd = () => {
    if (editingControl && editValue) {
      onLabelUpdate(editingControl, editValue);
    }
    setEditingControl(null);
  };

  const handleEditCancel = () => {
    setEditingControl(null);
  };

  // Define control arrays with their properties
  const topKnobs = [
    { id: "knob-cc13", cc: 13, ledColor: "led-red" as const },
    { id: "knob-cc14", cc: 14, ledColor: "led-red" as const },
    { id: "knob-cc15", cc: 15, ledColor: "led-red" as const },
    { id: "knob-cc16", cc: 16, ledColor: "led-red" as const },
    { id: "knob-cc17", cc: 17, ledColor: "led-red" as const },
    { id: "knob-cc18", cc: 18, ledColor: "led-red" as const },
    { id: "knob-cc19", cc: 19, ledColor: "led-red" as const },
    { id: "knob-cc20", cc: 20, ledColor: "led-red" as const },
  ];

  const middleKnobs = [
    { id: "knob-cc53", cc: 53, ledColor: "led-orange" as const },
    { id: "knob-cc22", cc: 22, ledColor: "led-orange" as const },
    { id: "knob-cc23", cc: 23, ledColor: "led-orange" as const },
    { id: "knob-cc24", cc: 24, ledColor: "led-orange" as const },
    { id: "knob-cc25", cc: 25, ledColor: "led-orange" as const },
    { id: "knob-cc26", cc: 26, ledColor: "led-orange" as const },
    { id: "knob-cc27", cc: 27, ledColor: "led-orange" as const },
    { id: "knob-cc28", cc: 28, ledColor: "led-orange" as const },
  ];

  const bottomKnobs = [
    { id: "knob-cc29", cc: 29, ledColor: "led-yellow" as const },
    { id: "knob-cc30", cc: 30, ledColor: "led-yellow" as const },
    { id: "knob-cc31", cc: 31, ledColor: "led-yellow" as const },
    { id: "knob-cc32", cc: 32, ledColor: "led-yellow" as const },
    { id: "knob-cc33", cc: 33, ledColor: "led-yellow" as const },
    { id: "knob-cc34", cc: 34, ledColor: "led-yellow" as const },
    { id: "knob-cc35", cc: 35, ledColor: "led-yellow" as const },
    { id: "knob-cc36", cc: 36, ledColor: "led-yellow" as const },
  ];

  const faders = [
    { id: "fader-cc5", cc: 5 },
    { id: "fader-cc6", cc: 6 },
    { id: "fader-cc7", cc: 7 },
    { id: "fader-cc8", cc: 8 },
    { id: "fader-cc9", cc: 9 },
    { id: "fader-cc10", cc: 10 },
    { id: "fader-cc11", cc: 11 },
    { id: "fader-cc12", cc: 12 },
  ];

  const topButtons = [
    { id: "button-cc37", cc: 37, ledColor: "led-green" as const },
    { id: "button-cc38", cc: 38, ledColor: "led-green" as const },
    { id: "button-cc39", cc: 39, ledColor: "led-green" as const },
    { id: "button-cc40", cc: 40, ledColor: "led-green" as const },
    { id: "button-cc41", cc: 41, ledColor: "led-green" as const },
    { id: "button-cc42", cc: 42, ledColor: "led-green" as const },
    { id: "button-cc43", cc: 43, ledColor: "led-green" as const },
    { id: "button-cc44", cc: 44, ledColor: "led-green" as const },
  ];

  const bottomButtons = [
    { id: "button-cc45", cc: 45, ledColor: "primary" as const },
    { id: "button-cc46", cc: 46, ledColor: "primary" as const },
    { id: "button-cc47", cc: 47, ledColor: "primary" as const },
    { id: "button-cc48", cc: 48, ledColor: "primary" as const },
    { id: "button-cc49", cc: 49, ledColor: "primary" as const },
    { id: "button-cc50", cc: 50, ledColor: "primary" as const },
    { id: "button-cc51", cc: 51, ledColor: "primary" as const },
    { id: "button-cc52", cc: 52, ledColor: "primary" as const },
  ];

  return (
    <motion.div
      className="w-full max-w-6xl mx-auto p-8 bg-gradient-surface border border-border/50 rounded-3xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-6">
        {/* Top Row Knobs */}
        <div className="grid grid-cols-8 gap-4 justify-items-center">
          {topKnobs.map((knob) => (
            <Knob
              key={knob.id}
              id={knob.id}
              cc={knob.cc}
              ledColor={knob.ledColor}
              isSelected={selectedControl === knob.id}
              control={controls[knob.id]}
              onSelect={onControlSelect}
              onLabelUpdate={onLabelUpdate}
              isEditing={editingControl === knob.id}
              editValue={editValue}
              onEditChange={setEditValue}
              onEditStart={() => handleEditStart(knob.id)}
              onEditEnd={handleEditEnd}
              onEditCancel={handleEditCancel}
            />
          ))}
        </div>

        {/* Middle Row Knobs */}
        <div className="grid grid-cols-8 gap-4 justify-items-center">
          {middleKnobs.map((knob) => (
            <Knob
              key={knob.id}
              id={knob.id}
              cc={knob.cc}
              ledColor={knob.ledColor}
              isSelected={selectedControl === knob.id}
              control={controls[knob.id]}
              onSelect={onControlSelect}
              onLabelUpdate={onLabelUpdate}
              isEditing={editingControl === knob.id}
              editValue={editValue}
              onEditChange={setEditValue}
              onEditStart={() => handleEditStart(knob.id)}
              onEditEnd={handleEditEnd}
              onEditCancel={handleEditCancel}
            />
          ))}
        </div>

        {/* Bottom Row Knobs */}
        <div className="grid grid-cols-8 gap-4 justify-items-center">
          {bottomKnobs.map((knob) => (
            <Knob
              key={knob.id}
              id={knob.id}
              cc={knob.cc}
              ledColor={knob.ledColor}
              isSelected={selectedControl === knob.id}
              control={controls[knob.id]}
              onSelect={onControlSelect}
              onLabelUpdate={onLabelUpdate}
              isEditing={editingControl === knob.id}
              editValue={editValue}
              onEditChange={setEditValue}
              onEditStart={() => handleEditStart(knob.id)}
              onEditEnd={handleEditEnd}
              onEditCancel={handleEditCancel}
            />
          ))}
        </div>

        {/* Faders */}
        <div className="grid grid-cols-8 gap-4 justify-items-center pt-4">
          {faders.map((fader) => (
            <Fader
              key={fader.id}
              id={fader.id}
              cc={fader.cc}
              isSelected={selectedControl === fader.id}
              control={controls[fader.id]}
              onSelect={onControlSelect}
              onLabelUpdate={onLabelUpdate}
              isEditing={editingControl === fader.id}
              editValue={editValue}
              onEditChange={setEditValue}
              onEditStart={() => handleEditStart(fader.id)}
              onEditEnd={handleEditEnd}
              onEditCancel={handleEditCancel}
            />
          ))}
        </div>

        {/* Top Buttons */}
        <div className="grid grid-cols-8 gap-4 justify-items-center pt-4">
          {topButtons.map((button) => (
            <Button
              key={button.id}
              id={button.id}
              cc={button.cc}
              ledColor={button.ledColor}
              isSelected={selectedControl === button.id}
              control={controls[button.id]}
              onSelect={onControlSelect}
              onLabelUpdate={onLabelUpdate}
              isEditing={editingControl === button.id}
              editValue={editValue}
              onEditChange={setEditValue}
              onEditStart={() => handleEditStart(button.id)}
              onEditEnd={handleEditEnd}
              onEditCancel={handleEditCancel}
            />
          ))}
        </div>

        {/* Bottom Buttons */}
        <div className="grid grid-cols-8 gap-4 justify-items-center">
          {bottomButtons.map((button) => (
            <Button
              key={button.id}
              id={button.id}
              cc={button.cc}
              ledColor={button.ledColor}
              isSelected={selectedControl === button.id}
              control={controls[button.id]}
              onSelect={onControlSelect}
              onLabelUpdate={onLabelUpdate}
              isEditing={editingControl === button.id}
              editValue={editValue}
              onEditChange={setEditValue}
              onEditStart={() => handleEditStart(button.id)}
              onEditEnd={handleEditEnd}
              onEditCancel={handleEditCancel}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ControllerVisual;
