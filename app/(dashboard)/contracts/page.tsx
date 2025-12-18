import { ContractList } from '@/components/contracts'

export default function ContractsPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Kontrakter</h1>
        <p className="text-muted-foreground mt-1">
          Administrer alle kontrakter, maler og signeringer
        </p>
      </div>

      <ContractList />
    </div>
  )
}
