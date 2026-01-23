'use client'

import { Risk, getRiskLevel, RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from '@/types/qms'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Link from 'next/link'

interface RiskMatrixProps {
  risks: Risk[]
  matrix: Record<string, Risk[]>
  onCellClick?: (likelihood: number, impact: number) => void
}

const LIKELIHOOD_LABELS = [
  'Svært usannsynlig',
  'Usannsynlig',
  'Mulig',
  'Sannsynlig',
  'Svært sannsynlig',
]

const IMPACT_LABELS = [
  'Ubetydelig',
  'Liten',
  'Moderat',
  'Betydelig',
  'Kritisk',
]

function getCellColor(likelihood: number, impact: number): string {
  const score = likelihood * impact
  const level = getRiskLevel(score)
  return RISK_LEVEL_COLORS[level]
}

function getCellTextColor(likelihood: number, impact: number): string {
  const score = likelihood * impact
  if (score >= 10) return 'text-white'
  return 'text-gray-800'
}

export function RiskMatrix({ risks, matrix, onCellClick }: RiskMatrixProps) {
  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Risikonivå:</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Lav (1-4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>Middels (5-9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span>Høy (10-16)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Kritisk (17-25)</span>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row - Impact */}
          <div className="flex">
            <div className="w-32 shrink-0" />
            <div className="flex-1 grid grid-cols-5 gap-1 mb-1">
              {IMPACT_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {label}
                  <div className="text-[10px] opacity-70">({i + 1})</div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact axis label */}
          <div className="flex">
            <div className="w-32 shrink-0" />
            <div className="flex-1 text-center text-sm font-semibold text-muted-foreground mb-2">
              Konsekvens →
            </div>
          </div>

          {/* Matrix rows */}
          <div className="flex">
            {/* Likelihood labels */}
            <div className="w-32 shrink-0 flex flex-col-reverse gap-1 pr-2">
              {LIKELIHOOD_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="h-20 flex items-center justify-end text-xs text-muted-foreground"
                >
                  <span className="text-right">
                    {label}
                    <span className="text-[10px] opacity-70 ml-1">({i + 1})</span>
                  </span>
                </div>
              ))}
              <div className="h-6 flex items-center justify-end text-sm font-semibold text-muted-foreground">
                ↑ Sannsynlighet
              </div>
            </div>

            {/* Matrix cells */}
            <div className="flex-1 flex flex-col-reverse gap-1">
              {[1, 2, 3, 4, 5].map((likelihood) => (
                <div key={likelihood} className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((impact) => {
                    const cellRisks = matrix[`${likelihood}-${impact}`] || []
                    const score = likelihood * impact

                    return (
                      <TooltipProvider key={`${likelihood}-${impact}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-20 rounded-lg ${getCellColor(likelihood, impact)} ${getCellTextColor(likelihood, impact)} flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`}
                              onClick={() => onCellClick?.(likelihood, impact)}
                            >
                              <div className="text-lg font-bold">{score}</div>
                              {cellRisks.length > 0 && (
                                <div className="text-xs mt-1 px-2 py-0.5 bg-black/20 rounded-full">
                                  {cellRisks.length} risiko
                                  {cellRisks.length > 1 ? 'er' : ''}
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-2">
                              <div className="font-medium">
                                Score: {score} (
                                {RISK_LEVEL_LABELS[getRiskLevel(score)]})
                              </div>
                              {cellRisks.length > 0 ? (
                                <div className="space-y-1">
                                  {cellRisks.slice(0, 5).map((risk) => (
                                    <Link
                                      key={risk.id}
                                      href={`/qms/risks/${risk.id}`}
                                      className="block text-sm hover:underline"
                                    >
                                      • {risk.risk_number}: {risk.title}
                                    </Link>
                                  ))}
                                  {cellRisks.length > 5 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{cellRisks.length - 5} flere...
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Ingen risikoer i dette nivået
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Summary cards component
interface RiskSummaryProps {
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
}

export function RiskSummary({ summary }: RiskSummaryProps) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="bg-muted rounded-lg p-4 text-center">
        <div className="text-3xl font-bold">{summary.total}</div>
        <div className="text-sm text-muted-foreground">Totalt</div>
      </div>
      <div className="bg-red-100 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-red-700">{summary.critical}</div>
        <div className="text-sm text-red-600">Kritisk</div>
      </div>
      <div className="bg-orange-100 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-orange-700">{summary.high}</div>
        <div className="text-sm text-orange-600">Høy</div>
      </div>
      <div className="bg-yellow-100 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-yellow-700">{summary.medium}</div>
        <div className="text-sm text-yellow-600">Middels</div>
      </div>
      <div className="bg-green-100 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-green-700">{summary.low}</div>
        <div className="text-sm text-green-600">Lav</div>
      </div>
    </div>
  )
}
