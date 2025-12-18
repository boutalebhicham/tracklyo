"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, Table2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import type { User, Transaction, Mission, Recap } from '@/lib/definitions'
import { generatePDFReport, downloadPDF, type ExportData as PDFExportData } from '@/lib/export-pdf'
import { generateExcelReport, downloadExcel, type ExportData as ExcelExportData } from '@/lib/export-excel'
import { format as formatDate } from 'date-fns'

type ExportButtonProps = {
  user: User
  viewedUserId: string
}

const ExportButton: React.FC<ExportButtonProps> = ({ user, viewedUserId }) => {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const firestore = useFirestore()

  // Fetch all data for the viewed user
  const transactionsQuery = useMemoFirebase(
    () => query(collection(firestore, 'users', viewedUserId, 'transactions'), orderBy('date', 'desc')),
    [firestore, viewedUserId]
  )
  const { data: transactions } = useCollection<Transaction>(transactionsQuery)

  const missionsQuery = useMemoFirebase(
    () => query(collection(firestore, 'users', viewedUserId, 'missions'), orderBy('createdAt', 'desc')),
    [firestore, viewedUserId]
  )
  const { data: missions } = useCollection<Mission>(missionsQuery)

  const recapsQuery = useMemoFirebase(
    () => query(collection(firestore, 'users', viewedUserId, 'recaps'), orderBy('date', 'desc')),
    [firestore, viewedUserId]
  )
  const { data: recaps } = useCollection<Recap>(recapsQuery)

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!transactions || !missions || !recaps) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Les données ne sont pas encore chargées.',
      })
      return
    }

    setIsExporting(true)

    try {
      const exportData: PDFExportData | ExcelExportData = {
        user,
        transactions,
        missions,
        recaps,
      }

      const dateStr = formatDate(new Date(), 'yyyy-MM-dd_HH-mm')
      const baseFilename = `rapport_${user.name.replace(/\s+/g, '_')}_${dateStr}`

      if (format === 'pdf') {
        toast({
          title: 'Génération PDF en cours...',
          description: 'Veuillez patienter.',
        })
        const blob = await generatePDFReport(exportData)
        downloadPDF(blob, `${baseFilename}.pdf`)
        toast({
          title: 'Rapport PDF généré',
          description: 'Le téléchargement a commencé.',
        })
      } else {
        toast({
          title: 'Génération Excel en cours...',
          description: 'Veuillez patienter.',
        })
        const blob = await generateExcelReport(exportData)
        downloadExcel(blob, `${baseFilename}.xlsx`)
        toast({
          title: 'Rapport Excel généré',
          description: 'Le téléchargement a commencé.',
        })
      }
    } catch (error) {
      console.error('[ExportButton] Error generating report:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de générer le rapport.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          disabled={isExporting || !transactions || !missions || !recaps}
        >
          {isExporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Export...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Exporter</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Choisir le format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
          <FileText size={16} className="mr-2 text-red-500" />
          <div className="flex-1">
            <p className="font-medium">Rapport PDF</p>
            <p className="text-xs text-muted-foreground">Document formaté avec tableaux</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting}>
          <Table2 size={16} className="mr-2 text-green-600" />
          <div className="flex-1">
            <p className="font-medium">Rapport Excel</p>
            <p className="text-xs text-muted-foreground">Données éditables en feuilles</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExportButton
