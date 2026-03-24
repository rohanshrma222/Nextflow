'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

interface UploadZoneProps {
  templateId: string;
  accept: string;
  acceptLabel: string;
  icon?: string;
  onUploadComplete: (url: string, fileName: string) => void;
  onUploadError?: (error: string) => void;
  customIdleContent?: React.ReactNode;
  customUploadingContent?: React.ReactNode;
  customProcessingContent?: React.ReactNode;
  hideBorder?: boolean;
  hideBackground?: boolean;
  inputId?: string;
  disableClick?: boolean;
  onStateChange?: (state: UploadState) => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface TransloaditAssembly {
  ok: string;
  error?: string;
  message?: string;
  assembly_url: string;
  assembly_ssl_url: string;
  uploads?: Array<{
    ssl_url?: string;
    url?: string;
    name?: string;
    size?: number;
    mime?: string;
  }>;
  results: Record<
    string,
    Array<{
      ssl_url: string;
      url: string;
      name: string;
      size: number;
      mime: string;
    }>
  >;
}

interface SignatureResponse {
  signature?: string;
  params?: string;
  error?: string;
}

const TRANSLOADIT_ASSEMBLY_URL = 'https://api2.transloadit.com/assemblies';
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function normalizeAcceptList(accept: string) {
  return accept
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function fileMatchesAccept(file: File, accept: string) {
  const accepted = normalizeAcceptList(accept);

  if (accepted.length === 0) {
    return true;
  }

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return accepted.some((entry) => {
    if (entry === '*/*') {
      return true;
    }

    if (entry.startsWith('.')) {
      return fileName.endsWith(entry);
    }

    if (entry.endsWith('/*')) {
      const prefix = entry.slice(0, -1);
      return fileType.startsWith(prefix);
    }

    return fileType === entry;
  });
}

function getUploadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Upload failed';
}

function getOriginalResultUrl(assembly: TransloaditAssembly) {
  return (
    assembly.results[':original']?.[0]?.ssl_url ||
    assembly.uploads?.[0]?.ssl_url ||
    ''
  );
}

function isAssemblyRunning(status: string | undefined) {
  return status === 'ASSEMBLY_UPLOADING' || status === 'ASSEMBLY_EXECUTING';
}

export function UploadZone({
  templateId,
  accept,
  acceptLabel,
  icon = '\u{1F4C4}',
  onUploadComplete,
  onUploadError,
  customIdleContent,
  customUploadingContent,
  customProcessingContent,
  hideBorder,
  hideBackground,
  inputId,
  disableClick,
  onStateChange,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const [dragging, setDragging] = useState(false);
  const [uploadState, setUploadStateInternal] = useState<UploadState>('idle');
  
  const setUploadState = (state: UploadState) => {
    setUploadStateInternal(state);
    onStateChange?.(state);
  };

  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (xhrRef.current) {
        xhrRef.current.abort();
      }

      if (pollTimeoutRef.current !== null) {
        window.clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  function clearPollingTimer() {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }

  function setErrorState(message: string) {
    if (!mountedRef.current) {
      return;
    }

    clearPollingTimer();
    setUploadState('error');
    setProgress(0);
    setErrorMessage(message);
    onUploadError?.(message);
  }

  function resetToIdle() {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    clearPollingTimer();
    setDragging(false);
    setUploadState('idle');
    setProgress(0);
    setFileName('');
    setErrorMessage('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function handleUploadPost(
    file: File,
    params: string,
    signature: string,
  ): Promise<TransloaditAssembly> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      xhrRef.current = xhr;

      formData.append('params', params);
      formData.append('signature', signature);
      formData.append('file', file);

      xhr.open('POST', TRANSLOADIT_ASSEMBLY_URL);

      xhr.upload.addEventListener('progress', (event) => {
        if (!event.lengthComputable || !mountedRef.current) {
          return;
        }

        setProgress(Math.round((event.loaded / event.total) * 100));
      });

      xhr.addEventListener('load', () => {
        xhrRef.current = null;

        let response: TransloaditAssembly | null = null;

        try {
          response = JSON.parse(xhr.responseText) as TransloaditAssembly;
        } catch {
          reject(new Error('Invalid response from Transloadit'));
          return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(response.error || response.message || 'Upload failed'));
          return;
        }

        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        if (mountedRef.current) {
          setProgress(100);
          setUploadState('processing');
        }

        resolve(response);
      });

      xhr.addEventListener('error', () => {
        xhrRef.current = null;
        reject(new Error('Network error while uploading file'));
      });

      xhr.addEventListener('abort', () => {
        xhrRef.current = null;
      });

      xhr.send(formData);
    });
  }

  async function pollAssemblyStatus(
    assembly: TransloaditAssembly,
    startedAt: number,
    originalFileName: string,
  ) {
    if (!mountedRef.current) {
      return;
    }

    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      setErrorState('Upload timed out');
      return;
    }

    try {
      const response = await fetch(assembly.assembly_ssl_url, {
        cache: 'no-store',
      });
      const data = (await response.json()) as TransloaditAssembly;

      if (data.error) {
        setErrorState(data.error);
        return;
      }

      if (!isAssemblyRunning(data.ok)) {
        const resultUrl = getOriginalResultUrl(data);

        if (data.ok !== 'ASSEMBLY_COMPLETED') {
          setErrorState(data.message || 'Upload failed during processing');
          return;
        }

        if (!resultUrl) {
          setErrorState('Upload completed but no file URL was returned');
          return;
        }

        clearPollingTimer();
        setUploadState('done');
        onUploadComplete(resultUrl, originalFileName);
        return;
      }

      pollTimeoutRef.current = window.setTimeout(() => {
        void pollAssemblyStatus(assembly, startedAt, originalFileName);
      }, POLL_INTERVAL_MS);
    } catch (error) {
      setErrorState(getUploadErrorMessage(error));
    }
  }

  async function startUpload(file: File) {
    if (!templateId) {
      setErrorState('Missing Transloadit template ID');
      return;
    }

    if (!fileMatchesAccept(file, accept)) {
      setErrorState(`Unsupported file type. Use ${acceptLabel}`);
      return;
    }

    try {
      clearPollingTimer();
      setDragging(false);
      setErrorMessage('');
      setFileName(file.name);
      setProgress(0);
      setUploadState('uploading');

      const signatureResponse = await fetch('/api/transloadit/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      });
      const signatureData =
        (await signatureResponse.json()) as SignatureResponse;

      if (
        !signatureResponse.ok ||
        !signatureData.signature ||
        !signatureData.params
      ) {
        throw new Error(
          signatureData.error || 'Failed to create upload signature',
        );
      }

      const assembly = await handleUploadPost(
        file,
        signatureData.params,
        signatureData.signature,
      );

      if (assembly.error) {
        throw new Error(assembly.error);
      }

      const resultUrl = getOriginalResultUrl(assembly);

      if (resultUrl) {
        setUploadState('done');
        onUploadComplete(resultUrl, file.name);
        return;
      }

      if (!assembly.assembly_ssl_url) {
        throw new Error('Transloadit did not return an assembly URL');
      }

      if (!mountedRef.current) {
        return;
      }

      setUploadState('processing');

      await pollAssemblyStatus(assembly, Date.now(), file.name);
    } catch (error) {
      setErrorState(getUploadErrorMessage(error));
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void startUpload(file);
    }

    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (uploadState === 'uploading' || uploadState === 'processing') {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void startUpload(file);
    }
  }

  const baseBorderColor = hideBorder
    ? 'transparent'
    : uploadState === 'error'
      ? 'rgba(248,113,113,0.4)'
      : dragging
        ? 'rgba(155,109,255,0.5)'
        : 'rgba(255,255,255,0.12)';
  const baseBackground = hideBackground
    ? 'transparent'
    : dragging && uploadState !== 'error'
      ? 'rgba(155,109,255,0.06)'
      : '#1a1a1a';

  return (
    <>
      <div
        className="upload-zone"
        style={{
          background: baseBackground,
          borderColor: baseBorderColor,
          color: '#f0f0f0',
          fontFamily: 'var(--font)',
          padding: '16px 12px',
        }}
        onClick={() => {
          if (disableClick || uploadState === 'uploading' || uploadState === 'processing') {
            return;
          }

          inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();

          if (uploadState === 'uploading' || uploadState === 'processing') {
            return;
          }

          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={handleDrop}
      >
        {uploadState === 'idle' && (
          customIdleContent ? customIdleContent : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 24, lineHeight: 1 }}>{icon}</div>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#f0f0f0',
                }}
              >
                Drop file or browse
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                {acceptLabel}
              </div>
            </div>
          )
        )}

        {uploadState === 'uploading' && (
          customUploadingContent ? customUploadingContent : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#f0f0f0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={fileName}
              >
                {truncateText(fileName, 24)}
              </div>
              <div
                style={{
                  width: '100%',
                  height: 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    borderRadius: 2,
                    background: '#9b6dff',
                    transition: 'width 180ms ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                Uploading{'...'} {progress}%
              </div>
            </div>
          )
        )}

        {uploadState === 'processing' && (
          customProcessingContent ? customProcessingContent : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="spinner" />
              <div
                style={{
                  fontSize: 12,
                  color: '#f0f0f0',
                }}
              >
                Processing{'...'}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                Transloadit is handling your file
              </div>
            </div>
          )
        )}

        {uploadState === 'error' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              color: '#f87171',
            }}
          >
            <div style={{ fontSize: 18, lineHeight: 1 }}>{'\u26A0\uFE0F'}</div>
            <div
              style={{
                fontSize: 11,
                maxWidth: '100%',
              }}
              title={errorMessage}
            >
              {truncateText(errorMessage, 60)}
            </div>
            <button
              type="button"
              style={{
                border: '1px solid rgba(248,113,113,0.28)',
                borderRadius: 6,
                background: 'rgba(248,113,113,0.08)',
                color: '#f87171',
                fontFamily: 'var(--font)',
                fontSize: 10,
                padding: '6px 10px',
                cursor: 'pointer',
              }}
              onClick={(event) => {
                event.stopPropagation();
                resetToIdle();
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </>
  );
}
