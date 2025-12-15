
"use client"

import React, { useState, useMemo } from 'react'
import type { DocumentFile } from '@/lib/definitions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Upload, Search, FileText, MoreHorizontal, Download, Edit, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

type FilesViewProps = {
  documents: DocumentFile[]
  onAddDocument: () => void
}

const FilesView = ({ documents, onAddDocument }: FilesViewProps) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [documents, searchTerm])

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileText className="text-blue-500" />;
    if (type === 'application/pdf') return <FileText className="text-red-500" />;
    return <FileText className="text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            Documents
            <Badge variant="secondary" className="text-base font-normal">{documents.length} fichiers</Badge>
          </h2>
          <p className="text-muted-foreground">Centralisez vos contrats et justificatifs.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un fichier..."
              className="w-full md:w-64 rounded-xl pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={onAddDocument} className="rounded-xl gap-2 dark:bg-card dark:text-card-foreground dark:hover:bg-card/80">
            <Upload size={16} />
            Upload
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div 
          onClick={onAddDocument}
          className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-4xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Ajouter un document</h3>
          <p className="text-muted-foreground text-sm">Glissez-déposez ou cliquez pour parcourir</p>
        </div>
      ) : (
        <Card className="rounded-4xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Taille</TableHead>
                  <TableHead className="hidden lg:table-cell">Date d'ajout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <span>{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="uppercase">{doc.type.split('/')[1] || doc.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{doc.size}</TableCell>
                    <TableCell className="hidden lg:table-cell">{format(parseISO(doc.date), 'd MMM yyyy', { locale: fr })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="gap-2"><Download size={16}/>Télécharger</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"><Edit size={16}/>Renommer</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 focus:text-red-500 gap-2"><Trash2 size={16}/>Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FilesView
