'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  Edit,
} from 'lucide-react'
import { toast } from 'sonner'

// Mock users data
const mockUsers = [
  {
    id: '1',
    name: 'Isak Dirdal',
    email: 'isak@bluecrew.no',
    role: 'super_admin',
    status: 'active',
    last_active: '2025-01-12T10:30:00',
  },
  {
    id: '2',
    name: 'Kari Nordmann',
    email: 'kari@bluecrew.no',
    role: 'recruiter',
    status: 'active',
    last_active: '2025-01-12T08:15:00',
  },
  {
    id: '3',
    name: 'Ole Hansen',
    email: 'ole@bluecrew.no',
    role: 'coordinator',
    status: 'active',
    last_active: '2025-01-11T16:45:00',
  },
  {
    id: '4',
    name: 'Maria Eriksen',
    email: 'maria@bluecrew.no',
    role: 'admin',
    status: 'invited',
    last_active: null,
  },
]

const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-800' },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  recruiter: { label: 'Rekrutterer', color: 'bg-blue-100 text-blue-800' },
  coordinator: { label: 'Koordinator', color: 'bg-green-100 text-green-800' },
  employee: { label: 'Ansatt', color: 'bg-gray-100 text-gray-800' },
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktiv', color: 'bg-green-100 text-green-800' },
  invited: { label: 'Invitert', color: 'bg-yellow-100 text-yellow-800' },
  inactive: { label: 'Inaktiv', color: 'bg-gray-100 text-gray-600' },
}

export default function UsersSettingsPage() {
  const [users] = useState(mockUsers)
  const [search, setSearch] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('recruiter')

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatLastActive = (date: string | null) => {
    if (!date) return 'Aldri'
    return new Date(date).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('Skriv inn en e-postadresse')
      return
    }

    // TODO: Implement invite
    toast.success('Invitasjon sendt', {
      description: `En invitasjon er sendt til ${inviteEmail}`,
    })
    setIsInviteOpen(false)
    setInviteEmail('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brukere</h1>
          <p className="text-muted-foreground">
            Administrer teammedlemmer og tilganger
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Inviter bruker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter ny bruker</DialogTitle>
              <DialogDescription>
                Send en invitasjon via e-post til et nytt teammedlem.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-postadresse</label>
                <Input
                  type="email"
                  placeholder="navn@firma.no"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rolle</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="recruiter">Rekrutterer</SelectItem>
                    <SelectItem value="coordinator">Koordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleInvite}>
                <Mail className="h-4 w-4 mr-2" />
                Send invitasjon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team ({users.length})</CardTitle>
              <CardDescription>
                Alle brukere med tilgang til AdminCrew
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter bruker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bruker</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sist aktiv</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const roleInfo = roleLabels[user.role]
                const statusInfo = statusLabels[user.status]

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleInfo.color}>
                        <Shield className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLastActive(user.last_active)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Rediger
                          </DropdownMenuItem>
                          {user.status === 'active' ? (
                            <DropdownMenuItem>
                              <UserX className="h-4 w-4 mr-2" />
                              Deaktiver
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Aktiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Fjern
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Rollebeskrivelser</CardTitle>
          <CardDescription>
            Oversikt over tilganger for hver rolle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-red-100 text-red-800">Super Admin</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Full tilgang til alle funksjoner, inkludert brukeradministrasjon og systeminnstillinger.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Tilgang til alle operasjonelle funksjoner, kan invitere brukere.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-100 text-blue-800">Rekrutterer</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Administrerer kandidater, matching og shortlisting.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-100 text-green-800">Koordinator</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Håndterer oppdrag, timer og daglig oppfølging.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
