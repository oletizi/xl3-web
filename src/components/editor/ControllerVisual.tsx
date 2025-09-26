import { motion } from "framer-motion";

interface ControllerVisualProps {
  selectedControl: string | null;
  onControlSelect: (controlId: string) => void;
}

const ControllerVisual = ({ selectedControl, onControlSelect }: ControllerVisualProps) => {
  const knobs = [
    // Top row knobs
    { id: "knob-1", x: 80, y: 60, label: "1" },
    { id: "knob-2", x: 140, y: 60, label: "2" },
    { id: "knob-3", x: 200, y: 60, label: "3" },
    { id: "knob-4", x: 260, y: 60, label: "4" },
    { id: "knob-5", x: 320, y: 60, label: "5" },
    { id: "knob-6", x: 380, y: 60, label: "6" },
    { id: "knob-7", x: 440, y: 60, label: "7" },
    { id: "knob-8", x: 500, y: 60, label: "8" },
    
    // Bottom row knobs
    { id: "knob-9", x: 80, y: 140, label: "9" },
    { id: "knob-10", x: 140, y: 140, label: "10" },
    { id: "knob-11", x: 200, y: 140, label: "11" },
    { id: "knob-12", x: 260, y: 140, label: "12" },
    { id: "knob-13", x: 320, y: 140, label: "13" },
    { id: "knob-14", x: 380, y: 140, label: "14" },
    { id: "knob-15", x: 440, y: 140, label: "15" },
    { id: "knob-16", x: 500, y: 140, label: "16" },
  ];

  const faders = [
    { id: "fader-1", x: 80, y: 250, label: "A" },
    { id: "fader-2", x: 140, y: 250, label: "B" },
    { id: "fader-3", x: 200, y: 250, label: "C" },
    { id: "fader-4", x: 260, y: 250, label: "D" },
    { id: "fader-5", x: 320, y: 250, label: "E" },
    { id: "fader-6", x: 380, y: 250, label: "F" },
    { id: "fader-7", x: 440, y: 250, label: "G" },
    { id: "fader-8", x: 500, y: 250, label: "H" },
  ];

  const buttons = [
    // Track Focus buttons (top)
    { id: "focus-1", x: 80, y: 200, label: "Focus 1" },
    { id: "focus-2", x: 140, y: 200, label: "Focus 2" },
    { id: "focus-3", x: 200, y: 200, label: "Focus 3" },
    { id: "focus-4", x: 260, y: 200, label: "Focus 4" },
    { id: "focus-5", x: 320, y: 200, label: "Focus 5" },
    { id: "focus-6", x: 380, y: 200, label: "Focus 6" },
    { id: "focus-7", x: 440, y: 200, label: "Focus 7" },
    { id: "focus-8", x: 500, y: 200, label: "Focus 8" },
    
    // Track Control buttons (bottom)
    { id: "control-1", x: 80, y: 380, label: "Control 1" },
    { id: "control-2", x: 140, y: 380, label: "Control 2" },
    { id: "control-3", x: 200, y: 380, label: "Control 3" },
    { id: "control-4", x: 260, y: 380, label: "Control 4" },
    { id: "control-5", x: 320, y: 380, label: "Control 5" },
    { id: "control-6", x: 380, y: 380, label: "Control 6" },
    { id: "control-7", x: 440, y: 380, label: "Control 7" },
    { id: "control-8", x: 500, y: 380, label: "Control 8" },
  ];

  const navButtons = [
    { id: "device", x: 600, y: 140, label: "Device" },
    { id: "mute", x: 600, y: 180, label: "Mute" },
    { id: "solo", x: 600, y: 220, label: "Solo" },
    { id: "record", x: 600, y: 260, label: "Record" },
  ];

  return (
    <div className="flex justify-center">
      <motion.svg 
        width="720" 
        height="420" 
        viewBox="0 0 720 420"
        className="max-w-full h-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Controller Body */}
        <rect 
          x="20" 
          y="20" 
          width="680" 
          height="380" 
          rx="20" 
          className="fill-card stroke-border stroke-2"
          filter="drop-shadow(0 0 20px hsl(var(--primary) / 0.1))"
        />
        
        {/* Novation Branding */}
        <text 
          x="360" 
          y="40" 
          textAnchor="middle" 
          className="fill-primary text-lg font-bold"
        >
          LAUNCH CONTROL XL3
        </text>

        {/* Knobs */}
        {knobs.map((knob, index) => (
          <g key={knob.id}>
            <motion.circle
              cx={knob.x}
              cy={knob.y}
              r="18"
              className={`cursor-pointer transition-all duration-200 stroke-2 ${
                selectedControl === knob.id 
                  ? "fill-hardware-knob-active stroke-primary shadow-glow-primary" 
                  : "fill-hardware-knob stroke-border hover:stroke-primary/50"
              }`}
              onClick={() => onControlSelect(knob.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            />
            
            {/* Knob Indicator */}
            <motion.line
              x1={knob.x}
              y1={knob.y - 15}
              x2={knob.x}
              y2={knob.y - 8}
              className={`stroke-2 ${
                selectedControl === knob.id ? "stroke-background" : "stroke-muted-foreground"
              }`}
              animate={{ rotate: selectedControl === knob.id ? [0, 360] : 0 }}
              transition={{ duration: 0.5 }}
              style={{ transformOrigin: `${knob.x}px ${knob.y}px` }}
            />
            
            <text 
              x={knob.x} 
              y={knob.y + 35} 
              textAnchor="middle" 
              className="fill-muted-foreground text-xs"
            >
              {knob.label}
            </text>
          </g>
        ))}

        {/* Faders */}
        {faders.map((fader, index) => (
          <g key={fader.id}>
            {/* Fader Track */}
            <rect 
              x={fader.x - 5} 
              y={fader.y} 
              width="10" 
              height="80" 
              rx="5"
              className="fill-muted stroke-border"
            />
            
            {/* Fader Handle */}
            <motion.rect
              x={fader.x - 8}
              y={fader.y + 30}
              width="16"
              height="20"
              rx="3"
              className={`cursor-pointer transition-all duration-200 ${
                selectedControl === fader.id 
                  ? "fill-secondary stroke-secondary shadow-glow-secondary" 
                  : "fill-hardware-button stroke-border hover:stroke-secondary/50"
              }`}
              onClick={() => onControlSelect(fader.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            />
            
            <text 
              x={fader.x} 
              y={fader.y + 100} 
              textAnchor="middle" 
              className="fill-muted-foreground text-xs font-semibold"
            >
              {fader.label}
            </text>
          </g>
        ))}

        {/* Buttons */}
        {buttons.map((button, index) => (
          <g key={button.id}>
            <motion.rect
              x={button.x - 12}
              y={button.y - 8}
              width="24"
              height="16"
              rx="3"
              className={`cursor-pointer transition-all duration-200 ${
                selectedControl === button.id 
                  ? "fill-accent stroke-accent shadow-glow-primary" 
                  : "fill-hardware-button stroke-border hover:stroke-accent/50"
              }`}
              onClick={() => onControlSelect(button.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.03 }}
            />
          </g>
        ))}

        {/* Navigation Buttons */}
        {navButtons.map((button, index) => (
          <g key={button.id}>
            <motion.circle
              cx={button.x}
              cy={button.y}
              r="15"
              className={`cursor-pointer transition-all duration-200 ${
                selectedControl === button.id 
                  ? "fill-warning stroke-warning shadow-glow-secondary" 
                  : "fill-hardware-button stroke-border hover:stroke-warning/50"
              }`}
              onClick={() => onControlSelect(button.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            />
            
            <text 
              x={button.x + 25} 
              y={button.y + 4} 
              className="fill-muted-foreground text-xs"
            >
              {button.label}
            </text>
          </g>
        ))}

        {/* Status LEDs */}
        <circle cx="650" cy="60" r="4" className="fill-hardware-led-green animate-pulse" />
        <circle cx="670" cy="60" r="4" className="fill-hardware-led-red" />
        <text x="650" y="85" textAnchor="middle" className="fill-muted-foreground text-xs">Power</text>
      </motion.svg>
    </div>
  );
};

export default ControllerVisual;