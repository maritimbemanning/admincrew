'use client'

import { useState } from 'react'
import { useContracts, useDeleteContract } from '@/hooks/use-contracts'
import { ContractCard } from './contract-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
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
  Contract,
  ContractFilters,
  ContractStatus,
  ContractType,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
} from '@/types/contracts'
import { Search, Plus, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'

export function ContractList() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ContractType | 'all'>('all')
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const filters: ContractFilters = {
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    type: typeFilter !== 'all' ? [typeFilter] : undefined,
  }

  const { data, isLoading, error } = useContracts({ filters, page, pageSize: 12 })
  const deleteContract = useDeleteContract()

  const handleDelete = async () => {
    if (!contractToDelete) return

    try {
      await deleteContract.mutateAsync(contractToDelete.id)
      toast.success('Kontrakt slettet')
      setContractToDelete(null)
    } catch {
      toast.error('Kunne ikke slette kontrakt')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
    setPage(1)
  }

  const hasActiveFilters = search || statusFilter !== 'all' || typeFilter !== 'all'

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Kunne ikke laste kontrakter</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Prøv igjen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk etter kontrakt..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ContractStatus | 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value as ContractType | 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typer</SelectItem>
              {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Nullstill
            </Button>
          )}
        </div>

        <Link href="/contracts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny kontrakt
          </Button>
        </Link>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : data?.contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Filter className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Ingen kontrakter funnet</h3>
          <p className="text-muted-foreground mt-1">
            {hasActiveFilters
              ? 'Prøv å endre filteret ditt'
              : 'Opprett din første kontrakt for å komme i gang'}
          </p>
          {!hasActiveFilters && (
            <Link href="/contracts/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Ny kontrakt
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.contracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onView={() => router.push(`/contracts/${contract.id}`)}
                onEdit={() => router.push(`/contracts/${contract.id}/edit`)}
                onDelete={() => setContractToDelete(contract)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Viser {(page - 1) * 12 + 1}-{Math.min(page * 12, data.total)} av {data.total}{' '}
                kontrakter
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Forrige
                </Button>
                <span className="text-sm">
                  Side {page} av {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Neste
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!contractToDelete} onOpenChange={() => setContractToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett kontrakt?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette kontrakten &quot;{contractToDelete?.title}&quot;?
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
