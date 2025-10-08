# Cloud Storage Components

Components for cloud-based mode storage, browsing, and management.

## Components

### SaveModeDialog

A comprehensive dialog component for saving MIDI controller mode configurations to the cloud.

**File**: `SaveModeDialog.tsx` (431 lines)

#### Features

- Form-based metadata entry with validation
- Support for name, description, category, tags, and visibility settings
- Real-time form validation using Zod schemas
- Loading states during save operations
- Success/error toast notifications
- Responsive design for mobile and desktop
- Accessibility-compliant (WCAG 2.1)

#### Props

```typescript
interface SaveModeDialogProps {
  mode: CustomMode;           // The mode to save
  open: boolean;              // Dialog open state
  onOpenChange: (open: boolean) => void;  // State change callback
  onSuccess?: (modeId: string) => void;   // Success callback
}
```

#### Usage Example

```tsx
import { useState } from 'react';
import { SaveModeDialog } from '@/components/cloud-storage';
import { CustomMode } from '@/types/mode';

function EditorPage() {
  const [currentMode, setCurrentMode] = useState<CustomMode>(/* ... */);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSaveSuccess = (modeId: string) => {
    console.log('Mode saved with ID:', modeId);
    // Navigate to mode detail page, show confirmation, etc.
  };

  return (
    <>
      <button onClick={() => setIsDialogOpen(true)}>
        Save to Cloud
      </button>

      <SaveModeDialog
        mode={currentMode}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSaveSuccess}
      />
    </>
  );
}
```

#### Form Fields

1. **Name** (required)
   - Max 255 characters
   - Alphanumeric with spaces, hyphens, underscores, parentheses
   - Validation: regex pattern matching

2. **Description** (optional)
   - Max 1000 characters
   - Textarea with resize capability
   - Helps users understand mode purpose

3. **Category** (optional)
   - Select dropdown with predefined categories:
     - DAW Control
     - Live Performance
     - Mixing & Mastering
     - Instrument Control
     - Genre-Specific
     - Educational
   - Each option includes description tooltip

4. **Tags** (optional)
   - Comma-separated input
   - Max 10 tags
   - Max 30 characters per tag
   - Automatically parsed and validated

5. **Is Public** (checkbox)
   - Default: false (private)
   - Public modes are visible in community library
   - Private modes are only visible to the author

#### Integration

The component integrates with:

- `useSaveMode()` hook from `@/hooks/use-cloud-modes`
- `CustomMode` type from `@/types/mode`
- `CloudModeMetadata` type from `@/types/cloud-mode`
- Shadcn/ui components (Dialog, Form, Input, etc.)
- Sonner toast notifications

#### Error Handling

- Form validation errors displayed inline per field
- Network/API errors shown via toast notifications
- Unsaved changes warning when closing dialog
- Loading state prevents multiple submissions

#### Accessibility

- Proper ARIA labels and descriptions
- Keyboard navigation support
- Focus management within dialog
- Screen reader compatible
- Color contrast compliant

#### Responsive Design

- Mobile-first approach
- Scrollable content area on small screens
- Max height: 90vh with overflow handling
- Touch-friendly input elements

#### Dependencies

```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "lucide-react": "icons",
  "sonner": "toast notifications"
}
```

## File Structure

```
src/components/cloud-storage/
├── index.ts                # Barrel exports
├── SaveModeDialog.tsx      # Save mode dialog component
└── README.md               # This file
```

## Future Components

- `BrowseModesDialog.tsx` - Browse and search cloud modes
- `ModeDetailView.tsx` - Detailed mode information display
- `ModeCard.tsx` - Mode card for list/grid views
- `ForkModeDialog.tsx` - Fork existing modes
- `DeleteModeDialog.tsx` - Delete mode confirmation

## Development Guidelines

- Follow @/ import pattern for all internal imports
- Use TypeScript strict mode
- Implement proper error handling (no fallbacks)
- Keep components under 500 lines
- Write comprehensive tests
- Use Zod for validation schemas
- Follow shadcn/ui patterns
