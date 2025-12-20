// app/(dashboard)/inbox/page.tsx
// Portal Inbox - Alle innkommende data fra bluecrew.no

import { Metadata } from 'next'
import { InboxClient } from './inbox-client'

export const metadata: Metadata = {
  title: 'Innboks | AdminCrew',
  description: 'Håndter innkommende søknader, leads og henvendelser fra bluecrew.no',
}

export default function InboxPage() {
  return <InboxClient />
}
