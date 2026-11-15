import { useRef } from 'react';

export const ACCEPTED_FILE_TYPES = '.log,.txt,.csv,.json';

interface FileOpenDialogProps {
  onFileOpen: (file: File) => void;
  disabled?: boolean;
}

export function FileOpenDialog({ onFileOpen, disabled = false }: FileOpenDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="file-open-dialog">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        Open File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileOpen(file);
          // Reset so selecting the same file again still fires a change event
          e.target.value = '';
        }}
      />
    </div>
  );
}
