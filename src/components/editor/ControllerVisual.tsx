import { motion } from "framer-motion";

interface ControllerVisualProps {
  selectedControl: string | null;
  onControlSelect: (controlId: string) => void;
}

const ControllerVisual = ({ selectedControl, onControlSelect }: ControllerVisualProps) => {
  // Top row knobs (CC 13-20) with red LEDs
  const topKnobs = [
    { id: "knob-cc13", x: 160, y: 120, cc: 13, ledColor: "led-red" },
    { id: "knob-cc14", x: 240, y: 120, cc: 14, ledColor: "led-red" },
    { id: "knob-cc15", x: 320, y: 120, cc: 15, ledColor: "led-red" },
    { id: "knob-cc16", x: 400, y: 120, cc: 16, ledColor: "led-red" },
    { id: "knob-cc17", x: 480, y: 120, cc: 17, ledColor: "led-red" },
    { id: "knob-cc18", x: 560, y: 120, cc: 18, ledColor: "led-red" },
    { id: "knob-cc19", x: 640, y: 120, cc: 19, ledColor: "led-red" },
    { id: "knob-cc20", x: 720, y: 120, cc: 20, ledColor: "led-red" },
  ];

  // Middle row knobs (CC 53, CC 22-28) with orange LEDs
  const middleKnobs = [
    { id: "knob-cc53", x: 160, y: 220, cc: 53, ledColor: "led-orange" },
    { id: "knob-cc22", x: 240, y: 220, cc: 22, ledColor: "led-orange" },
    { id: "knob-cc23", x: 320, y: 220, cc: 23, ledColor: "led-orange" },
    { id: "knob-cc24", x: 400, y: 220, cc: 24, ledColor: "led-orange" },
    { id: "knob-cc25", x: 480, y: 220, cc: 25, ledColor: "led-orange" },
    { id: "knob-cc26", x: 560, y: 220, cc: 26, ledColor: "led-orange" },
    { id: "knob-cc27", x: 640, y: 220, cc: 27, ledColor: "led-orange" },
    { id: "knob-cc28", x: 720, y: 220, cc: 28, ledColor: "led-orange" },
  ];

  // Bottom row knobs (CC 29-36) with yellow LEDs
  const bottomKnobs = [
    { id: "knob-cc29", x: 160, y: 320, cc: 29, ledColor: "led-yellow" },
    { id: "knob-cc30", x: 240, y: 320, cc: 30, ledColor: "led-yellow" },
    { id: "knob-cc31", x: 320, y: 320, cc: 31, ledColor: "led-yellow" },
    { id: "knob-cc32", x: 400, y: 320, cc: 32, ledColor: "led-yellow" },
    { id: "knob-cc33", x: 480, y: 320, cc: 33, ledColor: "led-yellow" },
    { id: "knob-cc34", x: 560, y: 320, cc: 34, ledColor: "led-yellow" },
    { id: "knob-cc35", x: 640, y: 320, cc: 35, ledColor: "led-yellow" },
    { id: "knob-cc36", x: 720, y: 320, cc: 36, ledColor: "led-yellow" },
  ];

  // Vertical faders (CC 5-12)
  const faders = [
    { id: "fader-cc5", x: 160, y: 400, cc: 5 },
    { id: "fader-cc6", x: 240, y: 400, cc: 6 },
    { id: "fader-cc7", x: 320, y: 400, cc: 7 },
    { id: "fader-cc8", x: 400, y: 400, cc: 8 },
    { id: "fader-cc9", x: 480, y: 400, cc: 9 },
    { id: "fader-cc10", x: 560, y: 400, cc: 10 },
    { id: "fader-cc11", x: 640, y: 400, cc: 11 },
    { id: "fader-cc12", x: 720, y: 400, cc: 12 },
  ];

  // Top button row (CC 37-44) - Green LEDs
  const topButtons = [
    { id: "button-cc37", x: 160, y: 580, cc: 37, ledColor: "led-green" },
    { id: "button-cc38", x: 240, y: 580, cc: 38, ledColor: "led-green" },
    { id: "button-cc39", x: 320, y: 580, cc: 39, ledColor: "led-green" },
    { id: "button-cc40", x: 400, y: 580, cc: 40, ledColor: "led-green" },
    { id: "button-cc41", x: 480, y: 580, cc: 41, ledColor: "led-green" },
    { id: "button-cc42", x: 560, y: 580, cc: 42, ledColor: "led-green" },
    { id: "button-cc43", x: 640, y: 580, cc: 43, ledColor: "led-green" },
    { id: "button-cc44", x: 720, y: 580, cc: 44, ledColor: "led-green" },
  ];

  // Bottom button row (CC 45-52) - Blue LEDs
  const bottomButtons = [
    { id: "button-cc45", x: 160, y: 660, cc: 45, ledColor: "primary" },
    { id: "button-cc46", x: 240, y: 660, cc: 46, ledColor: "primary" },
    { id: "button-cc47", x: 320, y: 660, cc: 47, ledColor: "primary" },
    { id: "button-cc48", x: 400, y: 660, cc: 48, ledColor: "primary" },
    { id: "button-cc49", x: 480, y: 660, cc: 49, ledColor: "primary" },
    { id: "button-cc50", x: 560, y: 660, cc: 50, ledColor: "primary" },
    { id: "button-cc51", x: 640, y: 660, cc: 51, ledColor: "primary" },
    { id: "button-cc52", x: 720, y: 660, cc: 52, ledColor: "primary" },
  ];

  const renderKnob = (knob: { id: string; x: number; y: number; cc: number; ledColor: string }, index: number) => (
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
        transition={{ delay: index * 0.03 }}
      />
      
      {/* Knob Indicator Line */}
      <motion.line
        x1={knob.x}
        y1={knob.y - 15}
        x2={knob.x}
        y2={knob.y - 8}
        className={`stroke-2 ${
          selectedControl === knob.id ? "stroke-background" : "stroke-muted-foreground"
        }`}
        style={{ transformOrigin: `${knob.x}px ${knob.y}px` }}
      />
      
      {/* LED Indicator Below Knob - full brightness */}
      <circle 
        cx={knob.x} 
        cy={knob.y + 30} 
        r="4" 
        className={`fill-${knob.ledColor} transition-opacity duration-300`}
        style={{ 
          opacity: 1,
          filter: selectedControl === knob.id ? 'brightness(1.5) drop-shadow(0 0 6px currentColor)' : 'none'
        }}
      />
      
      {/* CC Number Label */}
      <text 
        x={knob.x} 
        y={knob.y + 45} 
        textAnchor="middle" 
        className="fill-muted-foreground text-xs font-medium"
      >
        CC {knob.cc}
      </text>
      
      {/* Control Label */}
      <text 
        x={knob.x} 
        y={knob.y + 60} 
        textAnchor="middle" 
        className="fill-foreground text-xs font-semibold"
      >
        Knob {knob.cc}
      </text>
    </g>
  );

  const renderFader = (fader: { id: string; x: number; y: number; cc: number }, index: number) => (
    <g key={fader.id}>
      {/* Fader Track */}
      <rect 
        x={fader.x - 8} 
        y={fader.y} 
        width="16" 
        height="120" 
        rx="8"
        className="fill-muted stroke-border stroke-2"
      />
      
      {/* Fader Handle */}
      <motion.rect
        x={fader.x - 15}
        y={fader.y + 50}
        width="30"
        height="20"
        rx="4"
        className={`cursor-pointer transition-all duration-200 stroke-2 ${
          selectedControl === fader.id 
            ? "fill-secondary stroke-secondary shadow-glow-secondary" 
            : "fill-hardware-button stroke-border hover:stroke-secondary/50"
        }`}
        onClick={() => onControlSelect(fader.id)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + index * 0.05 }}
      />
      
      {/* CC Number Label */}
      <text 
        x={fader.x} 
        y={fader.y + 140} 
        textAnchor="middle" 
        className="fill-muted-foreground text-xs font-medium"
      >
        CC {fader.cc}
      </text>
      
      {/* Control Label */}
      <text 
        x={fader.x} 
        y={fader.y + 155} 
        textAnchor="middle" 
        className="fill-foreground text-xs font-semibold"
      >
        Fader {fader.cc}
      </text>
    </g>
  );

  const renderButton = (button: { id: string; x: number; y: number; cc: number; ledColor: string }, index: number, isTop: boolean) => (
    <g key={button.id}>
      {/* Button Body */}
      <motion.rect
        x={button.x - 25}
        y={button.y - 10}
        width="50"
        height="20"
        rx="10"
        className={`cursor-pointer transition-all duration-200 stroke-2 ${
          selectedControl === button.id 
            ? `fill-hardware-${button.ledColor} stroke-${button.ledColor} shadow-glow-primary` 
            : "fill-hardware-button stroke-border hover:stroke-primary/50"
        }`}
        onClick={() => onControlSelect(button.id)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: (isTop ? 0.8 : 0.9) + index * 0.03 }}
      />
      
      {/* LED Indicator */}
      <rect 
        x={button.x - 20} 
        y={button.y - 6} 
        width="40" 
        height="6" 
        rx="3"
        className={`fill-${button.ledColor} ${
          selectedControl === button.id ? 'animate-pulse' : ''
        }`}
        style={{ opacity: 1 }}
      />
      
      {/* CC Number Label */}
      <text 
        x={button.x} 
        y={button.y + 30} 
        textAnchor="middle" 
        className="fill-muted-foreground text-xs font-medium"
      >
        CC {button.cc}
      </text>
      
      {/* Control Label */}
      <text 
        x={button.x} 
        y={button.y + 45} 
        textAnchor="middle" 
        className="fill-foreground text-xs font-semibold"
      >
        Button {button.cc}
      </text>
    </g>
  );

  return (
    <div className="flex justify-center">
      <motion.svg 
        width="920" 
        height="800" 
        viewBox="0 0 920 800"
        className="max-w-full h-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Controller Body */}
        <rect 
          x="60" 
          y="60" 
          width="800" 
          height="680" 
          rx="30" 
          className="fill-card stroke-border stroke-2"
          filter="drop-shadow(0 0 20px hsl(var(--primary) / 0.1))"
        />

        {/* Top Row Knobs (CC 13-20) */}
        {topKnobs.map((knob, index) => renderKnob(knob, index))}

        {/* Middle Row Knobs (CC 53, CC 22-28) */}
        {middleKnobs.map((knob, index) => renderKnob(knob, index + 8))}

        {/* Bottom Row Knobs (CC 29-36) */}
        {bottomKnobs.map((knob, index) => renderKnob(knob, index + 16))}

        {/* Faders (CC 5-12) */}
        {faders.map((fader, index) => renderFader(fader, index))}

        {/* Top Button Row (CC 37-44) */}
        {topButtons.map((button, index) => renderButton(button, index, true))}

        {/* Bottom Button Row (CC 45-52) */}
        {bottomButtons.map((button, index) => renderButton(button, index, false))}
      </motion.svg>
    </div>
  );
};

export default ControllerVisual;