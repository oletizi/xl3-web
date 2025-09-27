/**
 * File storage utilities for custom modes
 * Supports both File System Access API and fallback methods
 */

interface FileHandle {
  createWritable(): Promise<WritableStream>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

interface OpenFilePickerOptions {
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  multiple?: boolean;
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileHandle>;
    showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<File[]>;
  }
}

/**
 * Saves a custom mode to a file
 * Uses File System Access API if available, falls back to download link
 */
export async function saveMode(mode: any): Promise<void> {
  if (!mode?.name) {
    throw new Error('Mode must have a name property');
  }

  const filename = `${mode.name}.lcxl3mode.json`;
  const jsonData = JSON.stringify(mode, null, 2);

  // Try File System Access API first
  if (window.showSaveFilePicker) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Launch Control XL3 Mode files',
            accept: {
              'application/json': ['.lcxl3mode.json'],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(jsonData);
      await writable.close();
      return;
    } catch (error) {
      // User cancelled or API failed, fall through to fallback
      if (error instanceof Error && error.name === 'AbortError') {
        return; // User cancelled
      }
      console.warn('File System Access API failed, using fallback:', error);
    }
  }

  // Fallback: Create download link
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Loads a custom mode from a file
 * Uses File System Access API if available, falls back to file input
 */
export async function loadMode(): Promise<any> {
  // Try File System Access API first
  if (window.showOpenFilePicker) {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Launch Control XL3 Mode files',
            accept: {
              'application/json': ['.lcxl3mode.json', '.json'],
            },
          },
        ],
        multiple: false,
      });

      const file = await fileHandle.getFile();
      const text = await file.text();
      const mode = JSON.parse(text);

      validateMode(mode);
      return mode;
    } catch (error) {
      // User cancelled or API failed, fall through to fallback
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('File selection cancelled');
      }
      console.warn('File System Access API failed, using fallback:', error);
    }
  }

  // Fallback: Create file input element
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.lcxl3mode.json,.json';
    input.style.display = 'none';

    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const text = await file.text();
        const mode = JSON.parse(text);

        validateMode(mode);
        resolve(mode);
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(input);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      reject(new Error('File selection cancelled'));
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Validates that a loaded object is a valid custom mode
 */
function validateMode(mode: any): void {
  if (!mode || typeof mode !== 'object') {
    throw new Error('Invalid mode file: not a valid JSON object');
  }

  if (!mode.name || typeof mode.name !== 'string') {
    throw new Error('Invalid mode file: missing or invalid name field');
  }

  if (!mode.controls || typeof mode.controls !== 'object') {
    throw new Error('Invalid mode file: missing or invalid controls field');
  }

  // Additional validation could be added here for specific control structure
}

/**
 * Checks if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}