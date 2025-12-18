'use client'

import { useState } from 'react'
import { useRisks, useRiskMatrix, useArchiveRisk } from '@/hooks/use-qms-risks'
import { RiskMatrix, RiskSummary } from '@/components/qms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  RiskFilters,
  RISK_CATEGORY_LABELS,
  RISK_STATUS_LABELS,
  RISK_STATUS_COLORS,
  getRiskLevel,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  RiskCategory,
  RiskStatus,
  Risk,
} from '@/types/qms'
import {
  Plus,
  Search,
  Shield,
  X,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
  LayoutGrid,
  List,
} from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { useDebounce } from '@/hooks/use-debounce'

export default function RisksPage() {
  const [filters, setFilters] = useState<RiskFilters>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'matrix' | 'list'>('matrix')

  const debouncedSearch = useDebounce(search, 300)

  const { data: matrixData, isLoading: matrixLoading } = useRiskMatrix()
  const { data: listData, isLoading: listLoading } = useRisks({
    filters: { ...filters, search: debouncedSearch },
    page,
    pageSize: 20,
  })

  const isLoading = view === 'matrix' ? matrixLoading : listLoading

  const clearFilters = () => {
    setFilters({})
    setSearch('')
    setPage(1)
  }

  const hasActiveFilters = search || filters.category?.length || filters.status?.length

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Risikoregister</h1>
          <p className="text-muted-foreground">
            Oversikt og håndtering av identifiserte risikoer
          </p>
        </div>
        <Link href="/qms/risks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny risiko
          </Button>
        </Link>
      </div>

      {/* View toggle and filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap gap-4">
          {view === 'list' && (
            <>
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter risikoer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={filters.category?.[0] || 'all'}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    category: value === 'all' ? undefined : [value as RiskCategory],
                  }))
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kategorier</SelectItem>
                  {(Object.entries(RISK_CATEGORY_LABELS) as [RiskCategory, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              <Select
                value={filters.status?.[0] || 'all'}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    status: value === 'all' ? undefined : [value as RiskStatus],
                  }))
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  {(Object.entries(RISK_STATUS_LABELS) as [RiskStatus, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Nullstill
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === 'matrix' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('matrix')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Matrise
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4 mr-2" />
            Liste
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[400px]" />
        </div>
      ) : view === 'matrix' ? (
        // Matrix view
        <div className="space-y-6">
          {matrixData && (
            <>
              <RiskSummary summary={matrixData.summary} />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risikomatrise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskMatrix
                    risks={matrixData.risks}
                    matrix={matrixData.matrix}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ) : (
        // List view
        <>
          {listData?.risks.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">Ingen risikoer</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Ingen risikoer matcher søket'
                  : 'Registrer en risiko for å komme i gang'}
              </p>
              {!hasActiveFilters && (
                <Link href="/qms/risks/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrer risiko
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nummer</TableHead>
                      <TableHead className="w-[30%]">Tittel</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Eier</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listData?.risks.map((risk) => {
                      const riskLevel = getRiskLevel(risk.risk_score)
                      return (
                        <TableRow key={risk.id}>
                          <TableCell className="font-mono text-sm">
                            {risk.risk_number}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/qms/risks/${risk.id}`}
                              className="font-medium hover:underline"
                            >
                              {risk.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {RISK_CATEGORY_LABELS[risk.category]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <div
                                className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm ${RISK_LEVEL_COLORS[riskLevel]}`}
                              >
                                {risk.risk_score}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={RISK_STATUS_COLORS[risk.status]}
                            >
                              {RISK_STATUS_LABELS[risk.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {risk.owner?.full_name || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/qms/risks/${risk.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Vis
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/qms/risks/${risk.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Rediger
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {listData && listData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Forrige
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Side {page} av {listData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(listData.totalPages, p + 1))}
                    disabled={page === listData.totalPages}
                  >
                    Neste
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
