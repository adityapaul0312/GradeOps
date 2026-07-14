'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, ImageIcon, X } from 'lucide-react'

interface UploadZoneProps {
  onFile: (file: File) => void
  onFiles?: (files: File[]) => void
  multiple?: boolean
  preview?: string | null
  disabled?: boolean
  onClear?: () => void
  label?: string
}

export default function UploadZone({ onFile, onFiles, multiple, preview, disabled, onClear, label }: UploadZoneProps) {
  const [dragErr, setDragErr] = useState<string | null>(null)

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setDragErr(null)
      if (rejected.length > 0) {
        setDragErr('Please upload a JPEG, PNG, or WebP image under 10 MB.')
        return
      }
      if (multiple && onFiles) {
        onFiles(accepted)
      } else if (accepted[0]) {
        onFile(accepted[0])
      }
    },
    [onFile, onFiles, multiple]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: multiple ? 40 : 1,
    maxSize: 10 * 1024 * 1024,
    multiple,
    disabled,
  })

  if (preview) {
    return (
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
        <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 420, objectFit: 'contain', background: '#000', display: 'block' }} />
        {!disabled && onClear && (
          <button
            onClick={onClear}
            style={{
              position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)',
              border: '1px solid var(--border-strong)', borderRadius: 99, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)',
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border-strong)'}`,
          borderRadius: 16, padding: '2.5rem 2rem', textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
          background: isDragActive ? 'var(--accent-glow)' : 'var(--bg-elevated)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input {...getInputProps()} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isDragActive ? <ImageIcon size={24} color="var(--accent-light)" /> : <Upload size={24} color="var(--accent-light)" />}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {isDragActive ? 'Drop it here' : label || 'Drop image or click to upload'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              JPEG, PNG, WebP — up to 10 MB{multiple ? ' each, multiple files OK' : ''}
            </p>
          </div>
        </div>
      </div>
      {dragErr && <p style={{ color: 'var(--red)', fontSize: '0.82rem', marginTop: 8 }}>{dragErr}</p>}
    </div>
  )
}
