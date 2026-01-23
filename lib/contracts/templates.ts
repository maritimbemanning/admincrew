/**
 * Contract Templates Module
 * 
 * Defines types and default templates for contract generation.
 */

export interface ContractParty {
  id?: string
  name: string
  role: 'client' | 'supplier' | 'consultant' | 'signatory'
  email?: string
  phone?: string
  orgNumber?: string
  signedAt?: Date | null
  signatureOrder: number
}

export interface ContractTemplate {
  id: string
  name: string
  type: ContractType
  language: 'no' | 'en'
  content: string
  fields: string[]
  version: number
  createdAt: Date
  updatedAt: Date
}

export type ContractType = 
  | 'assignment'
  | 'framework'
  | 'nda'
  | 'amendment'
  | 'termination'
  | 'extension'

export interface ContractData {
  // Common fields
  title?: string
  description?: string
  startDate?: Date | string
  endDate?: Date | string
  
  // Financial
  hourlyRate?: number
  totalValue?: number
  currency?: string
  paymentTerms?: string
  
  // Assignment specific
  role?: string
  location?: string
  workingHours?: string
  
  // Terms
  noticePeriod?: number
  confidentialityPeriod?: number
  
  // Custom fields
  [key: string]: any
}

/**
 * Default contract templates
 */
export const defaultTemplates: Partial<ContractTemplate>[] = [
  {
    id: 'assignment-standard',
    name: 'Standard Oppdragskontrakt',
    type: 'assignment',
    language: 'no',
    fields: ['description', 'role', 'startDate', 'endDate', 'hourlyRate', 'location', 'workingHours'],
  },
  {
    id: 'framework-standard',
    name: 'Standard Rammeavtale',
    type: 'framework',
    language: 'no',
    fields: ['terms', 'noticePeriod'],
  },
  {
    id: 'nda-standard',
    name: 'Taushetserklæring',
    type: 'nda',
    language: 'no',
    fields: ['confidentialityPeriod', 'scope'],
  },
  {
    id: 'amendment-standard',
    name: 'Endringsavtale',
    type: 'amendment',
    language: 'no',
    fields: ['originalContractId', 'changes', 'effectiveDate'],
  },
]

/**
 * Contract clause library
 */
export const contractClauses = {
  confidentiality: {
    no: `
      <h3>Konfidensialitet</h3>
      <p>Partene forplikter seg til å behandle all informasjon som utveksles i forbindelse med 
      dette oppdraget som konfidensiell. Denne forpliktelsen gjelder også etter at oppdraget 
      er avsluttet, i en periode på {{confidentialityPeriod}} måneder.</p>
    `,
    en: `
      <h3>Confidentiality</h3>
      <p>The parties undertake to treat all information exchanged in connection with this 
      assignment as confidential. This obligation also applies after the assignment has ended, 
      for a period of {{confidentialityPeriod}} months.</p>
    `,
  },
  termination: {
    no: `
      <h3>Oppsigelse</h3>
      <p>Hver av partene kan si opp denne avtalen med {{noticePeriod}} dagers skriftlig varsel.
      Ved vesentlig mislighold kan avtalen heves med umiddelbar virkning.</p>
    `,
    en: `
      <h3>Termination</h3>
      <p>Either party may terminate this agreement with {{noticePeriod}} days written notice.
      In case of material breach, the agreement may be terminated with immediate effect.</p>
    `,
  },
  liability: {
    no: `
      <h3>Ansvarsbegrensning</h3>
      <p>Partenes samlede ansvar under denne avtalen er begrenset til kontraktsverdien, 
      med mindre skaden skyldes grov uaktsomhet eller forsett.</p>
    `,
    en: `
      <h3>Limitation of Liability</h3>
      <p>The parties' total liability under this agreement is limited to the contract value,
      unless the damage is caused by gross negligence or intent.</p>
    `,
  },
  disputeResolution: {
    no: `
      <h3>Tvisteløsning</h3>
      <p>Tvister som oppstår i forbindelse med denne avtalen skal søkes løst gjennom forhandlinger.
      Dersom partene ikke kommer til enighet, skal tvisten avgjøres ved de ordinære domstoler
      med Oslo tingrett som verneting.</p>
    `,
    en: `
      <h3>Dispute Resolution</h3>
      <p>Disputes arising in connection with this agreement shall be sought resolved through 
      negotiations. If the parties cannot reach agreement, the dispute shall be decided by 
      the ordinary courts with Oslo District Court as the legal venue.</p>
    `,
  },
  ipRights: {
    no: `
      <h3>Immaterielle rettigheter</h3>
      <p>Alt arbeid som utføres i henhold til denne avtalen, inkludert oppfinnelser, 
      kildekode og dokumentasjon, tilfaller Oppdragsgiver ved levering.</p>
    `,
    en: `
      <h3>Intellectual Property Rights</h3>
      <p>All work performed under this agreement, including inventions, source code and 
      documentation, shall belong to the Client upon delivery.</p>
    `,
  },
}

/**
 * Get template by type
 */
export function getTemplatesByType(type: ContractType): Partial<ContractTemplate>[] {
  return defaultTemplates.filter(t => t.type === type)
}

/**
 * Get all available contract types with labels
 */
export const contractTypeLabels: Record<ContractType, { no: string; en: string }> = {
  assignment: { no: 'Oppdragskontrakt', en: 'Assignment Contract' },
  framework: { no: 'Rammeavtale', en: 'Framework Agreement' },
  nda: { no: 'Taushetserklæring', en: 'Non-Disclosure Agreement' },
  amendment: { no: 'Endringsavtale', en: 'Amendment' },
  termination: { no: 'Oppsigelsesavtale', en: 'Termination Agreement' },
  extension: { no: 'Forlengelsesavtale', en: 'Extension Agreement' },
}
