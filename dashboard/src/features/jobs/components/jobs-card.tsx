import { useRef } from 'react'
import { PRODUCT_ARCHETYPE } from '@/product-config'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  useJobs,
  useUploadJob,
  downloadJobResult,
  type Job,
} from '../data/jobs'

function statusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default'
  if (status === 'failed') return 'destructive'
  if (status === 'processing') return 'secondary'
  return 'outline' // pending
}

function statusLabel(status: string): string {
  if (status === 'pending') return 'Queued'
  if (status === 'processing') return 'Processing'
  if (status === 'completed') return 'Done'
  if (status === 'failed') return 'Failed'
  return status
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function jobDisplayName(job: Job): string {
  if (job.input_file_paths && job.input_file_paths.length > 0) {
    const names = job.input_file_paths.map((p) => p.split('/').pop() ?? p)
    return names.length === 1 ? names[0] : `${names.length} files`
  }
  return job.input_file_path?.split('_').slice(1).join('_') ?? 'Upload'
}


// PRODUCT_CUSTOMIZE: the `accept` attribute on the file input describes
// what file types this product processes (e.g. '.csv,.xlsx,.pdf').
// Set MULTI_FILE = true for products needing more than one input file per job.
const SHOW_UPLOAD = PRODUCT_ARCHETYPE === 'extraction' || PRODUCT_ARCHETYPE === 'report'
const MULTI_FILE = false

export function JobsCard() {
  const { uploadFile, uploadFiles, uploading, error } = useUploadJob()
  const { data: jobs, isLoading } = useJobs()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (MULTI_FILE) {
      uploadFiles(files)
    } else if (files[0]) {
      uploadFile(files[0])
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length === 0) return
    if (MULTI_FILE) {
      uploadFiles(files)
    } else if (files[0]) {
      uploadFile(files[0])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {SHOW_UPLOAD ? (MULTI_FILE ? 'Upload files' : 'Upload a file') : 'Processing Queue'}
        </CardTitle>
        {SHOW_UPLOAD && (
          <CardDescription>
            {MULTI_FILE
              ? 'Drop your files here to start processing. You’ll see them appear below as they work through the queue.'
              : 'Drop a file to start processing. You’ll see it appear below as it works through the queue.'}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        {SHOW_UPLOAD && (
          <div
            className='flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center'
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <p className='text-sm text-muted-foreground'>
              Drag and drop {MULTI_FILE ? 'files' : 'a file'} here, or
            </p>
            <Button
              variant='outline'
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading
                ? 'Uploading...'
                : MULTI_FILE
                  ? 'Choose files'
                  : 'Choose file'}
            </Button>
            <input
              ref={inputRef}
              type='file'
              multiple={MULTI_FILE}
              className='hidden'
              onChange={handleFileChange}
            />
            {error && <p className='text-sm text-destructive'>{error}</p>}
          </div>
        )}

        <div className='space-y-2'>
          {isLoading && (
            <p className='text-sm text-muted-foreground'>Loading jobs...</p>
          )}
          {!isLoading && jobs && jobs.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No uploads yet. Files you upload will appear here.
            </p>
          )}
          {jobs?.slice(0, 5).map((job) => (
            <div
              key={job.id}
              className='flex items-center justify-between rounded-md border px-3 py-2'
            >
              <div className='space-y-0.5'>
                <p className='text-sm font-medium'>{jobDisplayName(job)}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatTime(job.created_at)}
                  {job.status === 'failed' && job.error_message
                    ? ` — ${job.error_message}`
                    : ''}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant={statusBadgeVariant(job.status)}>
                  {statusLabel(job.status)}
                </Badge>
                {job.status === 'completed' && job.output_file_path && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      downloadJobResult(
                        job.output_file_path!,
                        `${jobDisplayName(job)}-result.csv`
                      )
                    }
                  >
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
