/**
 * Contract Generator Module
 * 
 * Generates contracts from templates with dynamic field replacement.
 * Supports multiple contract types and party configurations.
 */

import { ContractTemplate, ContractParty, ContractData } from './templates'

export interface GenerateContractOptions {
  templateId: string
  parties: ContractParty[]
  data: Record<string, any>
  language?: 'no' | 'en'
  format?: 'pdf' | 'html' | 'docx'
}

export interface GeneratedContract {
  id: string
  templateId: string
  content: string
  format: string
  createdAt: Date
  parties: ContractParty[]
  metadata: Record<string, any>
}

/**
 * Replace template placeholders with actual data
 */
function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template
  
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    result = result.replace(placeholder, String(value ?? ''))
  })
  
  return result
}

/**
 * Format date for Norwegian contracts
 */
export function formatContractDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format currency for contracts
 */
export function formatContractCurrency(amount: number, currency = 'NOK'): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Generate party signature block
 */
function generateSignatureBlock(party: ContractParty): string {
  return `
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="party-name">${party.name}</p>
      <p class="party-role">${party.role}</p>
      ${party.email ? `<p class="party-email">${party.email}</p>` : ''}
      <p class="signature-date">Dato: _______________</p>
    </div>
  `
}

/**
 * Generate contract from template
 */
export async function generateContract(
  options: GenerateContractOptions
): Promise<GeneratedContract> {
  const { templateId, parties, data, language = 'no', format = 'html' } = options

  // Get template (in real implementation, fetch from database)
  const template = await getTemplate(templateId, language)
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}`)
  }

  // Prepare data with formatted values
  const formattedData: Record<string, string> = {
    ...data,
    currentDate: formatContractDate(new Date()),
    startDate: data.startDate ? formatContractDate(data.startDate) : '',
    endDate: data.endDate ? formatContractDate(data.endDate) : '',
    hourlyRate: data.hourlyRate ? formatContractCurrency(data.hourlyRate) : '',
    totalValue: data.totalValue ? formatContractCurrency(data.totalValue) : '',
  }

  // Add party information
  parties.forEach((party, index) => {
    formattedData[`party${index + 1}Name`] = party.name
    formattedData[`party${index + 1}Role`] = party.role
    formattedData[`party${index + 1}Email`] = party.email || ''
    formattedData[`party${index + 1}OrgNumber`] = party.orgNumber || ''
  })

  // Replace placeholders in template
  let content = replacePlaceholders(template.content, formattedData)

  // Add signature blocks
  const signatureBlocks = parties.map(generateSignatureBlock).join('\n')
  content = content.replace('{{signatureBlocks}}', signatureBlocks)

  // Generate unique contract ID
  const contractId = `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  return {
    id: contractId,
    templateId,
    content,
    format,
    createdAt: new Date(),
    parties,
    metadata: {
      language,
      generatedFrom: templateId,
      dataHash: hashData(formattedData),
    },
  }
}

/**
 * Get template by ID (stub - would fetch from database)
 */
async function getTemplate(
  templateId: string,
  language: string
): Promise<ContractTemplate | null> {
  // In real implementation, fetch from database
  const templates: Record<string, ContractTemplate> = {
    'assignment-contract': {
      id: 'assignment-contract',
      name: 'Oppdragskontrakt',
      type: 'assignment',
      language: 'no',
      content: `
        <div class="contract">
          <h1>OPPDRAGSKONTRAKT</h1>
          <p>Denne kontrakten er inngått mellom:</p>
          <p><strong>{{party1Name}}</strong> ({{party1Role}})</p>
          <p>og</p>
          <p><strong>{{party2Name}}</strong> ({{party2Role}})</p>
          
          <h2>1. Oppdragsbeskrivelse</h2>
          <p>{{description}}</p>
          
          <h2>2. Varighet</h2>
          <p>Fra: {{startDate}}</p>
          <p>Til: {{endDate}}</p>
          
          <h2>3. Honorar</h2>
          <p>Timerate: {{hourlyRate}}</p>
          
          <h2>4. Signaturer</h2>
          {{signatureBlocks}}
        </div>
      `,
      fields: ['description', 'startDate', 'endDate', 'hourlyRate'],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'framework-agreement': {
      id: 'framework-agreement',
      name: 'Rammeavtale',
      type: 'framework',
      language: 'no',
      content: `
        <div class="contract">
          <h1>RAMMEAVTALE</h1>
          <p>Dato: {{currentDate}}</p>
          
          <h2>Parter</h2>
          <p>Denne rammeavtalen er inngått mellom:</p>
          <p><strong>{{party1Name}}</strong></p>
          <p>Org.nr: {{party1OrgNumber}}</p>
          <p>og</p>
          <p><strong>{{party2Name}}</strong></p>
          
          <h2>Generelle vilkår</h2>
          <p>{{terms}}</p>
          
          <h2>Signaturer</h2>
          {{signatureBlocks}}
        </div>
      `,
      fields: ['terms'],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }

  return templates[templateId] || null
}

/**
 * Simple hash function for data integrity
 */
function hashData(data: Record<string, any>): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

/**
 * Validate contract data before generation
 */
export function validateContractData(
  templateId: string,
  data: Record<string, any>,
  parties: ContractParty[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required parties
  if (!parties || parties.length < 2) {
    errors.push('Kontrakten må ha minst to parter')
  }

  // Check party information
  parties.forEach((party, index) => {
    if (!party.name) {
      errors.push(`Part ${index + 1} mangler navn`)
    }
    if (!party.email && !party.signedAt) {
      errors.push(`Part ${index + 1} mangler e-postadresse`)
    }
  })

  // Template-specific validation
  if (templateId === 'assignment-contract') {
    if (!data.startDate) errors.push('Startdato er påkrevd')
    if (!data.endDate) errors.push('Sluttdato er påkrevd')
    if (!data.hourlyRate && !data.totalValue) {
      errors.push('Timerate eller totalverdi er påkrevd')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
