import { motion } from "framer-motion";

interface ControllerVisualProps {
  selectedControl: string | null;
  onControlSelect: (controlId: string) => void;
}

const ControllerVisual = ({ selectedControl, onControlSelect }: ControllerVisualProps) => {
  // Top row knobs (CC 13-20) with red LEDs
  const topKnobs = [
    { id: "knob-cc13", x: 120, y: 80, cc: 13, ledColor: "led-red" },
    { id: "knob-cc14", x: 180, y: 80, cc: 14, ledColor: "led-red" },
    { id: "knob-cc15", x: 240, y: 80, cc: 15, ledColor: "led-red" },
    { id: "knob-cc16", x: 300, y: 80, cc: 16, ledColor: "led-red" },
    { id: "knob-cc17", x: 360, y: 80, cc: 17, ledColor: "led-red" },
    { id: "knob-cc18", x: 420, y: 80, cc: 18, ledColor: "led-red" },
    { id: "knob-cc19", x: 480, y: 80, cc: 19, ledColor: "led-red" },
    { id: "knob-cc20", x: 540, y: 80, cc: 20, ledColor: "led-red" },
  ];

  // Middle row knobs (CC 53, CC 22-28) with orange LEDs
  const middleKnobs = [
    { id: "knob-cc53", x: 120, y: 140, cc: 53, ledColor: "led-orange" },
    { id: "knob-cc22", x: 180, y: 140, cc: 22, ledColor: "led-orange" },
    { id: "knob-cc23", x: 240, y: 140, cc: 23, ledColor: "led-orange" },
    { id: "knob-cc24", x: 300, y: 140, cc: 24, ledColor: "led-orange" },
    { id: "knob-cc25", x: 360, y: 140, cc: 25, ledColor: "led-orange" },
    { id: "knob-cc26", x: 420, y: 140, cc: 26, ledColor: "led-orange" },
    { id: "knob-cc27", x: 480, y: 140, cc: 27, ledColor: "led-orange" },
    { id: "knob-cc28", x: 540, y: 140, cc: 28, ledColor: "led-orange" },
  ];

  // Bottom row knobs (CC 29-36) with yellow LEDs
  const bottomKnobs = [
    { id: "knob-cc29", x: 120, y: 200, cc: 29, ledColor: "warning" },
    { id: "knob-cc30", x: 180, y: 200, cc: 30, ledColor: "warning" },
    { id: "knob-cc31", x: 240, y: 200, cc: 31, ledColor: "warning" },
    { id: "knob-cc32", x: 300, y: 200, cc: 32, ledColor: "warning" },
    { id: "knob-cc33", x: 360, y: 200, cc: 33, ledColor: "warning" },
    { id: "knob-cc34", x: 420, y: 200, cc: 34, ledColor: "warning" },
    { id: "knob-cc35", x: 480, y: 200, cc: 35, ledColor: "warning" },
    { id: "knob-cc36", x: 540, y: 200, cc: 36, ledColor: "warning" },
  ];

  // Vertical faders (CC 5-12)
  const faders = [
    { id: "fader-cc5", x: 120, y: 280, cc: 5 },
    { id: "fader-cc6", x: 180, y: 280, cc: 6 },
    { id: "fader-cc7", x: 240, y: 280, cc: 7 },
    { id: "fader-cc8", x: 300, y: 280, cc: 8 },
    { id: "fader-cc9", x: 360, y: 280, cc: 9 },
    { id: "fader-cc10", x: 420, y: 280, cc: 10 },
    { id: "fader-cc11", x: 480, y: 280, cc: 11 },
    { id: "fader-cc12", x: 540, y: 280, cc: 12 },
  ];

  // Top button row (CC 37-44) - Green LEDs
  const topButtons = [
    { id: "button-cc37", x: 120, y: 400, cc: 37, ledColor: "led-green" },
    { id: "button-cc38", x: 180, y: 400, cc: 38, ledColor: "led-green" },
    { id: "button-cc39", x: 240, y: 400, cc: 39, ledColor: "led-green" },
    { id: "button-cc40", x: 300, y: 400, cc: 40, ledColor: "led-green" },
    { id: "button-cc41", x: 360, y: 400, cc: 41, ledColor: "led-green" },
    { id: "button-cc42", x: 420, y: 400, cc: 42, ledColor: "led-green" },
    { id: "button-cc43", x: 480, y: 400, cc: 43, ledColor: "led-green" },
    { id: "button-cc44", x: 540, y: 400, cc: 44, ledColor: "led-green" },
  ];

  // Bottom button row (CC 45-52) - Blue LEDs
  const bottomButtons = [
    { id: "button-cc45", x: 120, y: 440, cc: 45, ledColor: "primary" },
    { id: "button-cc46", x: 180, y: 440, cc: 46, ledColor: "primary" },
    { id: "button-cc47", x: 240, y: 440, cc: 47, ledColor: "primary" },
    { id: "button-cc48", x: 300, y: 440, cc: 48, ledColor: "primary" },
    { id: "button-cc49", x: 360, y: 440, cc: 49, ledColor: "primary" },
    { id: "button-cc50", x: 420, y: 440, cc: 50, ledColor: "primary" },
    { id: "button-cc51", x: 480, y: 440, cc: 51, ledColor: "primary" },
    { id: "button-cc52", x: 540, y: 440, cc: 52, ledColor: "primary" },
  ];

  const renderKnob = (knob: any, index: number) => (
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
      
      {/* LED Indicator */}
      <circle 
        cx={knob.x} 
        cy={knob.y - 30} 
        r="3" 
        className={`fill-hardware-${knob.ledColor} ${
          selectedControl === knob.id ? 'animate-pulse' : ''
        }`}
      />
      
      {/* CC Number Label */}
      <text 
        x={knob.x} 
        y={knob.y + 35} 
        textAnchor="middle" 
        className="fill-muted-foreground text-xs font-medium"
      >
        CC {knob.cc}
      </text>
    </g>
  );

  const renderFader = (fader: any, index: number) => (
    <g key={fader.id}>
      {/* Fader Track */}
      <rect 
        x={fader.x - 6} 
        y={fader.y} 
        width="12" 
        height="100" 
        rx="6"
        className="fill-muted stroke-border stroke-2"
      />
      
      {/* Fader Handle */}
      <motion.rect
        x={fader.x - 12}
        y={fader.y + 40}
        width="24"
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
        y={fader.y + 120} 
        textAnchor="middle" 
        className="fill-muted-foreground text-xs font-medium"
      >
        CC {fader.cc}
      </text>
    </g>
  );

  const renderButton = (button: any, index: number, isTop: boolean) => (
    <g key={button.id}>
      {/* Button Body */}
      <motion.rect
        x={button.x - 20}
        y={button.y - 8}
        width="40"
        height="16"
        rx="8"
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
        x={button.x - 15} 
        y={button.y - 5} 
        width="30" 
        height="4" 
        rx="2"
        className={`fill-hardware-${button.ledColor} ${
          selectedControl === button.id ? 'animate-pulse' : 'opacity-60'
        }`}
      />
      
      {/* CC Number Label */}
      <text 
        x={button.x} 
        y={button.y + 25} 
        textAnchor="middle" 
        className="fill-muted-foreground text-xs font-medium"
      >
        CC {button.cc}
      </text>
    </g>
  );

  return (
    <div className="flex justify-center">
      <motion.svg 
        width="620" 
        height="500" 
        viewBox="0 0 620 500"
        className="max-w-full h-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Controller Body */}
        <rect 
          x="20" 
          y="40" 
          width="580" 
          height="420" 
          rx="20" 
          className="fill-card stroke-border stroke-2"
          filter="drop-shadow(0 0 20px hsl(var(--primary) / 0.1))"
        />
        
        {/* Novation Branding */}
        <text 
          x="310" 
          y="30" 
          textAnchor="middle" 
          className="fill-primary text-sm font-bold"
        >
          LAUNCH CONTROL XL3
        </text>

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