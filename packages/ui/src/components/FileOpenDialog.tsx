interface FileOpenDialogProps {
  onFileOpen: (file: File) => void;
}

export function FileOpenDialog({ onFileOpen }: FileOpenDialogProps) {
  return (
    <div className="file-open-dialog">
      <h2>Open Log File</h2>
      <p>Select a log file to explore. Supports .log, .txt, .csv, and .json files.</p>
      <input
        type="file"
        accept=".log,.txt,.csv,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileOpen(file);
        }}
      />
    </div>
  );
}
