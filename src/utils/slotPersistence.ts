const ACTIVE_SLOT_KEY = 'lcxl3-active-slot';
const SLOT_NAMES_KEY = 'lcxl3-slot-names';

export function saveActiveSlot(slotIndex: number): void {
  if (slotIndex < 0 || slotIndex > 14) {
    throw new Error(`Invalid slot index: ${slotIndex}`);
  }
  localStorage.setItem(ACTIVE_SLOT_KEY, String(slotIndex));
}

export function loadActiveSlot(): number {
  const stored = localStorage.getItem(ACTIVE_SLOT_KEY);
  const parsed = parseInt(stored || '0', 10);

  if (isNaN(parsed) || parsed < 0 || parsed > 14) {
    return 0; // Default to slot 0
  }

  return parsed;
}

export function saveSlotNames(names: string[]): void {
  if (names.length !== 15) {
    throw new Error(`Expected 15 slot names, got ${names.length}`);
  }
  localStorage.setItem(SLOT_NAMES_KEY, JSON.stringify(names));
}

export function loadSlotNames(): string[] | null {
  const stored = localStorage.getItem(SLOT_NAMES_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length === 15) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSlotData(): void {
  localStorage.removeItem(ACTIVE_SLOT_KEY);
  localStorage.removeItem(SLOT_NAMES_KEY);
}
