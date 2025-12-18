'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  CapaAction,
  CAPA_TYPE_LABELS,
  CAPA_STATUS_LABELS,
  CapaStatus,
} from '@/types/qms'
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Play,
  XCircle,
  Shield,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface CapaListProps {
  capaActions: CapaAction[]
  ncId: string
  onAdd?: () => void
  onEdit?: (capa: CapaAction) => void
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: CapaStatus) => void
  readonly?: boolean
}

const STATUS_COLORS: Record<CapaStatus, string> = {
  planned: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  verified: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

export function CapaList({
  capaActions,
  ncId,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  readonly = false,
}: CapaListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = () => {
    if (deleteId && onDelete) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const getNextStatus = (current: CapaStatus): CapaStatus | null => {
    const flow: Record<CapaStatus, CapaStatus | null> = {
      planned: 'in_progress',
      in_progress: 'completed',
      completed: 'verified',
      verified: null,
      cancelled: null,
    }
    return flow[current]
  }

  if (capaActions.length === 0 && !onAdd) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Ingen CAPA-tiltak registrert
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!readonly && onAdd && (
        <div className="flex justify-end">
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Legg til tiltak
          </Button>
        </div>
      )}

      {capaActions.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="w-[40%]">Beskrivelse</TableHead>
              <TableHead>Ansvarlig</TableHead>
              <TableHead>Frist</TableHead>
              <TableHead>Status</TableHead>
              {!readonly && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {capaActions.map((capa) => {
              const nextStatus = getNextStatus(capa.status)
              const isOverdue =
                capa.due_date &&
                new Date(capa.due_date) < new Date() &&
                !['completed', 'verified', 'cancelled'].includes(capa.status)

              return (
                <TableRow key={capa.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        capa.type === 'corrective'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }
                    >
                      {CAPA_TYPE_LABELS[capa.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{capa.description}</p>
                      {capa.effectiveness_note && (
                        <p className="text-xs text-muted-foreground">
                          Effektivitet: {capa.effectiveness_note}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {capa.responsible?.full_name || (
                      <span className="text-muted-foreground">Ikke tildelt</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {capa.due_date ? (
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(capa.due_date), 'dd.MM.yyyy', {
                          locale: nb,
                        })}
                        {isOverdue && ' (Forfalt)'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[capa.status]}>
                      {CAPA_STATUS_LABELS[capa.status]}
                    </Badge>
                  </TableCell>
                  {!readonly && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && capa.status !== 'verified' && (
                            <DropdownMenuItem onClick={() => onEdit(capa)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Rediger
                            </DropdownMenuItem>
                          )}
                          {onStatusChange && nextStatus && (
                            <>
                              {nextStatus === 'in_progress' && (
                                <DropdownMenuItem
                                  onClick={() => onStatusChange(capa.id, nextStatus)}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Start
                                </DropdownMenuItem>
                              )}
                              {nextStatus === 'completed' && (
                                <DropdownMenuItem
                                  onClick={() => onStatusChange(capa.id, nextStatus)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Marker fullført
                                </DropdownMenuItem>
                              )}
                              {nextStatus === 'verified' && (
                                <DropdownMenuItem
                                  onClick={() => onStatusChange(capa.id, nextStatus)}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Verifiser
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {onStatusChange &&
                            !['completed', 'verified', 'cancelled'].includes(
                              capa.status
                            ) && (
                              <DropdownMenuItem
                                onClick={() => onStatusChange(capa.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Kanseller
                              </DropdownMenuItem>
                            )}
                          {onDelete && capa.status === 'planned' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(capa.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Slett
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett CAPA-tiltak?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette dette tiltaket? Denne handlingen kan
              ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Slett</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
