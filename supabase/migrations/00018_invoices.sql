-- ══════════════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00018_invoices.sql
-- Fakturaer
-- ══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,  -- 'INV-2025-0001'

  -- Relasjoner
  organization_id UUID NOT NULL REFERENCES crm_organizations(id),
  contact_id UUID REFERENCES crm_contacts(id),

  -- Type
  invoice_type TEXT DEFAULT 'standard',  -- 'standard', 'credit', 'prepayment'
  credit_for_invoice_id UUID REFERENCES invoices(id),

  -- Beløp
  subtotal_nok DECIMAL(12,2) NOT NULL,
  vat_rate DECIMAL(4,2) DEFAULT 25.00,
  vat_amount_nok DECIMAL(12,2),
  total_nok DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'NOK',

  -- Datoer
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,

  -- Status
  status TEXT DEFAULT 'draft',  -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'

  -- Betaling
  paid_at TIMESTAMPTZ,
  paid_amount_nok DECIMAL(12,2),
  payment_reference TEXT,

  -- Tripletex
  tripletex_id TEXT,
  tripletex_synced_at TIMESTAMPTZ,

  -- Filer
  pdf_path TEXT,

  -- Notater
  notes TEXT,
  internal_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES user_profiles(id)
);

-- Invoice lines
CREATE TABLE invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Kobling
  assignment_id UUID REFERENCES assignments(id),
  timesheet_id UUID REFERENCES assignment_timesheets(id),

  -- Detaljer
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'stk',  -- 'stk', 'time', 'dag'
  unit_price_nok DECIMAL(10,2) NOT NULL,
  amount_nok DECIMAL(12,2) NOT NULL,

  -- Sortering
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due ON invoices(due_date) WHERE status IN ('sent', 'overdue');
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- Trigger
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || to_char(NOW(), 'YYYY') || '-' ||
      LPAD((SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)
      ), 0) + 1
      FROM invoices
      WHERE invoice_number LIKE 'INV-' || to_char(NOW(), 'YYYY') || '-%')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_auto_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Add FK from timesheets to invoices
ALTER TABLE assignment_timesheets
  ADD CONSTRAINT fk_timesheets_invoice
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view invoices" ON invoices
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage invoices" ON invoices
  FOR ALL USING (public.is_staff());

CREATE POLICY "Staff can view invoice lines" ON invoice_lines
  FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage invoice lines" ON invoice_lines
  FOR ALL USING (public.is_staff());
