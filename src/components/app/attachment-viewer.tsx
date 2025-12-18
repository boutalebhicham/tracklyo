"use client"

import React, { useState } from 'react'
import { FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

type AttachmentViewerProps = {
  attachments: string[]
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachments }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!attachments || attachments.length === 0) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  const getFileType = (url: string) => {
    if (url.includes('.pdf') || url.includes('application/pdf')) {
      return 'pdf'
    }
    return 'image'
  }

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="gap-1 text-xs">
          <Paperclip size={12} />
          {attachments.length}
        </Badge>
        <div className="flex gap-1">
          {attachments.slice(0, 2).map((url, index) => {
            const fileType = getFileType(url)
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent"
                onClick={() => {
                  if (fileType === 'pdf') {
                    openInNewTab(url)
                  } else {
                    setSelectedImage(url)
                  }
                }}
                title={fileType === 'pdf' ? 'Ouvrir le PDF' : 'Voir l\'image'}
              >
                {fileType === 'pdf' ? (
                  <FileText size={14} className="text-red-500" />
                ) : (
                  <ImageIcon size={14} className="text-blue-500" />
                )}
              </Button>
            )
          })}
          {attachments.length > 2 && (
            <Badge variant="secondary" className="h-6 px-1.5 text-xs">
              +{attachments.length - 2}
            </Badge>
          )}
        </div>
      </div>

      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <X size={20} />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Justificatif"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AttachmentViewer
