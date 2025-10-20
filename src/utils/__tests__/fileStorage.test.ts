import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveMode,
  loadMode,
  isFileSystemAccessSupported,
} from '@/utils/fileStorage';

describe('fileStorage', () => {
  const createTestMode = () => ({
    name: 'Test Mode',
    description: 'Test description',
    version: '1.0.0',
    controls: {
      'knob-cc13': {
        id: 'knob-cc13',
        type: 'knob',
        ccNumber: 13,
        midiChannel: 1,
        minValue: 0,
        maxValue: 127,
        label: 'Test Knob',
      },
    },
    createdAt: '2025-01-01T00:00:00Z',
    modifiedAt: '2025-01-01T00:00:00Z',
  });

  describe('isFileSystemAccessSupported', () => {
    let originalWindow: Window & typeof globalThis;

    beforeEach(() => {
      originalWindow = global.window;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should return true when both APIs are available', () => {
      global.window = {
        showSaveFilePicker: vi.fn(),
        showOpenFilePicker: vi.fn(),
      } as any;

      expect(isFileSystemAccessSupported()).toBe(true);
    });

    it('should return false when showSaveFilePicker is missing', () => {
      global.window = {
        showOpenFilePicker: vi.fn(),
      } as any;

      expect(isFileSystemAccessSupported()).toBe(false);
    });

    it('should return false when showOpenFilePicker is missing', () => {
      global.window = {
        showSaveFilePicker: vi.fn(),
      } as any;

      expect(isFileSystemAccessSupported()).toBe(false);
    });

    it('should return false when both APIs are missing', () => {
      global.window = {} as any;

      expect(isFileSystemAccessSupported()).toBe(false);
    });

    it('should return false when window is undefined', () => {
      global.window = undefined as any;

      expect(isFileSystemAccessSupported()).toBe(false);
    });
  });

  describe('saveMode', () => {
    let mockCreateElement: typeof document.createElement;
    let mockAppendChild: typeof document.body.appendChild;
    let mockRemoveChild: typeof document.body.removeChild;
    let mockCreateObjectURL: typeof URL.createObjectURL;
    let mockRevokeObjectURL: typeof URL.revokeObjectURL;
    let mockConsoleWarn: typeof console.warn;

    beforeEach(() => {
      mockCreateElement = document.createElement.bind(document);
      mockAppendChild = document.body.appendChild.bind(document.body);
      mockRemoveChild = document.body.removeChild.bind(document.body);
      mockCreateObjectURL = URL.createObjectURL;
      mockRevokeObjectURL = URL.revokeObjectURL;
      mockConsoleWarn = console.warn;

      // Mock URL methods
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = vi.fn();
      console.warn = vi.fn();
    });

    afterEach(() => {
      document.createElement = mockCreateElement;
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;
      console.warn = mockConsoleWarn;
    });

    it('should throw error for mode without name', async () => {
      const invalidMode = { ...createTestMode(), name: undefined };
      await expect(saveMode(invalidMode)).rejects.toThrow('Mode must have a name property');
    });

    it('should throw error for mode with empty name', async () => {
      const invalidMode = { ...createTestMode(), name: '' };
      await expect(saveMode(invalidMode)).rejects.toThrow('Mode must have a name property');
    });

    it('should throw error for null mode', async () => {
      await expect(saveMode(null as any)).rejects.toThrow('Mode must have a name property');
    });

    describe('with File System Access API', () => {
      beforeEach(() => {
        const mockWritable = {
          write: vi.fn().mockResolvedValue(undefined),
          close: vi.fn().mockResolvedValue(undefined),
        };

        const mockFileHandle = {
          createWritable: vi.fn().mockResolvedValue(mockWritable),
        };

        global.window.showSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      });

      afterEach(() => {
        delete (global.window as any).showSaveFilePicker;
      });

      it('should use File System Access API when available', async () => {
        const mode = createTestMode();
        await saveMode(mode);

        expect(window.showSaveFilePicker).toHaveBeenCalledWith({
          suggestedName: 'Test Mode.lcxl3mode.json',
          types: [
            {
              description: 'Launch Control XL3 Mode files',
              accept: {
                'application/json': ['.lcxl3mode.json'],
              },
            },
          ],
        });
      });

      it('should write JSON data to file', async () => {
        const mode = createTestMode();
        await saveMode(mode);

        const mockFileHandle = await window.showSaveFilePicker!();
        const mockWritable = await mockFileHandle.createWritable();

        expect(mockWritable.write).toHaveBeenCalledWith(
          JSON.stringify(mode, null, 2)
        );
        expect(mockWritable.close).toHaveBeenCalled();
      });

      it('should handle user cancellation', async () => {
        const mode = createTestMode();
        const abortError = new Error('User cancelled');
        abortError.name = 'AbortError';

        window.showSaveFilePicker = vi.fn().mockRejectedValue(abortError);

        await expect(saveMode(mode)).rejects.toThrow('File save cancelled');
      });

      it('should fall back to download on API error', async () => {
        const mode = createTestMode();
        window.showSaveFilePicker = vi.fn().mockRejectedValue(new Error('API failed'));

        let clickedLink: HTMLAnchorElement | null = null;
        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'a') {
            const link = mockCreateElement.call(document, tagName) as HTMLAnchorElement;
            link.click = vi.fn(() => {
              clickedLink = link;
            });
            return link;
          }
          return mockCreateElement.call(document, tagName);
        }) as any;

        await saveMode(mode);

        expect(clickedLink).not.toBeNull();
        expect(clickedLink?.download).toBe('Test Mode.lcxl3mode.json');
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('with fallback method', () => {
      beforeEach(() => {
        delete (global.window as any).showSaveFilePicker;
      });

      it('should create download link with correct filename', async () => {
        const mode = createTestMode();
        let createdLink: HTMLAnchorElement | null = null;

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'a') {
            const link = mockCreateElement.call(document, tagName) as HTMLAnchorElement;
            link.click = vi.fn(() => {
              createdLink = link;
            });
            return link;
          }
          return mockCreateElement.call(document, tagName);
        }) as any;

        await saveMode(mode);

        expect(createdLink).not.toBeNull();
        expect(createdLink?.download).toBe('Test Mode.lcxl3mode.json');
        expect(createdLink?.href).toBe('blob:mock-url');
      });

      it('should create blob with JSON content', async () => {
        const mode = createTestMode();
        await saveMode(mode);

        expect(URL.createObjectURL).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'application/json',
          })
        );
      });

      it('should clean up object URL after delay', async () => {
        vi.useFakeTimers();
        const mode = createTestMode();

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'a') {
            const link = mockCreateElement.call(document, tagName) as HTMLAnchorElement;
            link.click = vi.fn();
            return link;
          }
          return mockCreateElement.call(document, tagName);
        }) as any;

        await saveMode(mode);

        expect(URL.revokeObjectURL).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

        vi.useRealTimers();
      });

      it('should handle mode name with special characters', async () => {
        const mode = { ...createTestMode(), name: 'Test "Mode" / Special' };
        let createdLink: HTMLAnchorElement | null = null;

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'a') {
            const link = mockCreateElement.call(document, tagName) as HTMLAnchorElement;
            link.click = vi.fn(() => {
              createdLink = link;
            });
            return link;
          }
          return mockCreateElement.call(document, tagName);
        }) as any;

        await saveMode(mode);

        expect(createdLink?.download).toBe('Test "Mode" / Special.lcxl3mode.json');
      });
    });
  });

  describe('loadMode', () => {
    let mockConsoleWarn: typeof console.warn;

    beforeEach(() => {
      mockConsoleWarn = console.warn;
      console.warn = vi.fn();
    });

    afterEach(() => {
      console.warn = mockConsoleWarn;
    });

    describe('with File System Access API', () => {
      beforeEach(() => {
        const mode = createTestMode();
        const mockFile = {
          text: vi.fn().mockResolvedValue(JSON.stringify(mode)),
        };

        const mockFileHandle = {
          getFile: vi.fn().mockResolvedValue(mockFile),
        };

        global.window.showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);
      });

      afterEach(() => {
        delete (global.window as any).showOpenFilePicker;
      });

      it('should use File System Access API when available', async () => {
        await loadMode();

        expect(window.showOpenFilePicker).toHaveBeenCalledWith({
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
      });

      it('should parse and return valid mode', async () => {
        const result = await loadMode();

        expect(result).toEqual(createTestMode());
      });

      it('should validate mode structure', async () => {
        const invalidMode = { notAMode: true };
        const mockFile = {
          text: vi.fn().mockResolvedValue(JSON.stringify(invalidMode)),
        };

        const mockFileHandle = {
          getFile: vi.fn().mockResolvedValue(mockFile),
        };

        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);

        await expect(loadMode()).rejects.toThrow('missing or invalid name field');
      });

      it('should handle user cancellation', async () => {
        const abortError = new Error('User cancelled');
        abortError.name = 'AbortError';

        window.showOpenFilePicker = vi.fn().mockRejectedValue(abortError);

        await expect(loadMode()).rejects.toThrow('File selection cancelled');
      });

      it('should handle invalid JSON', async () => {
        const mockFile = {
          text: vi.fn().mockResolvedValue('invalid json {'),
        };

        const mockFileHandle = {
          getFile: vi.fn().mockResolvedValue(mockFile),
        };

        window.showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle]);

        await expect(loadMode()).rejects.toThrow();
      });

      it('should fall back on API error', async () => {
        window.showOpenFilePicker = vi.fn().mockRejectedValue(new Error('API failed'));

        // Setup fallback
        const mode = createTestMode();
        let inputElement: HTMLInputElement | null = null;

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            inputElement = input;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify(mode)),
              }],
            });
            // Trigger onchange immediately
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        const result = await loadMode();

        expect(console.warn).toHaveBeenCalled();
        expect(result).toEqual(mode);
      });
    });

    describe('with fallback method', () => {
      beforeEach(() => {
        delete (global.window as any).showOpenFilePicker;
      });

      it('should create file input element', async () => {
        const mode = createTestMode();
        let inputCreated = false;

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            inputCreated = true;
            const input = document.createElement('input') as HTMLInputElement;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify(mode)),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await loadMode();

        expect(inputCreated).toBe(true);
      });

      it('should set correct input attributes', async () => {
        const mode = createTestMode();
        let inputElement: HTMLInputElement | null = null;

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            inputElement = input;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify(mode)),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await loadMode();

        expect(inputElement?.type).toBe('file');
        expect(inputElement?.accept).toBe('.lcxl3mode.json,.json');
      });

      it('should handle no file selected', async () => {
        let inputElement: HTMLInputElement | null = null;

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            inputElement = input;
            Object.defineProperty(input, 'files', {
              get: () => null,
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('No file selected');
      });

      it('should handle file cancellation', async () => {
        let inputElement: HTMLInputElement | null = null;

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            inputElement = input;
            setTimeout(() => input.oncancel?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('File selection cancelled');
      });

      it('should validate loaded mode', async () => {
        const invalidMode = { name: 'Test', controls: 'invalid' };

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify(invalidMode)),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('missing or invalid controls field');
      });
    });

    describe('validation', () => {
      beforeEach(() => {
        delete (global.window as any).showOpenFilePicker;
      });

      it('should reject non-object data', async () => {
        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify('not an object')),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('not a valid JSON object');
      });

      it('should reject mode without name', async () => {
        const invalidMode = { controls: {} };

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify(invalidMode)),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('missing or invalid name field');
      });

      it('should reject mode with non-string name', async () => {
        const invalidMode = { name: 123, controls: {} };

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify(invalidMode)),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('missing or invalid name field');
      });

      it('should reject mode without controls', async () => {
        const invalidMode = { name: 'Test' };

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify(invalidMode)),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('missing or invalid controls field');
      });

      it('should reject mode with non-object controls', async () => {
        const invalidMode = { name: 'Test', controls: 'not an object' };

        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue(JSON.stringify(invalidMode)),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('missing or invalid controls field');
      });

      it('should accept mode with null data', async () => {
        document.createElement = vi.fn((tagName: string) => {
          if (tagName === 'input') {
            const input = document.createElement('input') as HTMLInputElement;
            Object.defineProperty(input, 'files', {
              get: () => [{
                text: vi.fn().mockResolvedValue('null'),
              }],
            });
            setTimeout(() => input.onchange?.(null as any), 0);
            return input;
          }
          return document.createElement(tagName);
        }) as any;

        await expect(loadMode()).rejects.toThrow('not a valid JSON object');
      });
    });
  });
});
