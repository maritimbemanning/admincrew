'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, User, Bell, Palette, Shield, Database } from 'lucide-react'
import Link from 'next/link'

const settingsSections = [
  {
    title: 'Min profil',
    description: 'Administrer din brukerinformasjon og preferanser',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Varsler',
    description: 'Konfigurer e-post og push-varsler',
    href: '/settings/notifications',
    icon: Bell,
    disabled: true,
  },
  {
    title: 'Utseende',
    description: 'Tilpass tema og visningsinnstillinger',
    href: '/settings/appearance',
    icon: Palette,
    disabled: true,
  },
  {
    title: 'Sikkerhet',
    description: 'Passord, tofaktor-autentisering og øktinnstillinger',
    href: '/settings/security',
    icon: Shield,
    disabled: true,
  },
  {
    title: 'Integrasjoner',
    description: 'Koble til eksterne tjenester',
    href: '/settings/integrations',
    icon: Database,
    disabled: true,
  },
]

export default function SettingsPage() {
  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Innstillinger
        </h1>
        <p className="text-muted-foreground mt-1">
          Administrer kontoinnstillinger og preferanser
        </p>
      </div>

      <div className="grid gap-4">
        {settingsSections.map((section) => (
          <Card
            key={section.href}
            className={section.disabled ? 'opacity-50' : 'hover:bg-muted/50 transition-colors'}
          >
            {section.disabled ? (
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <section.icon className="h-5 w-5" />
                  {section.title}
                  <span className="text-xs bg-muted px-2 py-1 rounded">Kommer</span>
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            ) : (
              <Link href={section.href}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <section.icon className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Link>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
