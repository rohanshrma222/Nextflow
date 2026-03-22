'use client';
import { useRef, useState, DragEvent } from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  accept: string;
  acceptLabel: string;
  onFile: (file: File, url: string) => void;
  icon?: string;
}

export function UploadZone({ accept, acceptLabel, onFile, icon = '📁' }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    onFile(file, url);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <>
      <div
        className="upload-zone"
        style={dragging ? { borderColor: 'rgba(155,109,255,0.6)', background: 'rgba(155,109,255,0.1)' } : {}}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="text-lg mb-1">{icon}</div>
        <div className="text-[11px] text-[#505050] leading-[1.5]">
          Drop or{' '}
          <span className="text-[#9b6dff]">browse</span>
          <br />
          <span className="text-[9px] opacity-70">{acceptLabel}</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </>
  );
}
