"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Phone } from 'lucide-react'

const WhatsAppFab = ({ phoneNumber }: { phoneNumber: string }) => {
  if (!phoneNumber) return null;

  return (
    <Button
      asChild
      size="icon"
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-2xl z-50"
    >
      <a href={`https://wa.me/${phoneNumber}`} target="_blank" rel="noopener noreferrer">
        <Phone size={24} color="white" />
      </a>
    </Button>
  )
}

export default WhatsAppFab
