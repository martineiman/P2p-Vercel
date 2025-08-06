"use client"

import { useState } from "react"
import type { User } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Cake, Gift, Heart } from "lucide-react"

interface BirthdaysSectionProps {
  users: User[]
}

interface BirthdayUser extends User {
  daysUntil: number
  isToday: boolean
}

export function BirthdaysSection({ users }: BirthdaysSectionProps) {
  const [selectedUser, setSelectedUser] = useState<BirthdayUser | null>(null)
  const [congratsMessage, setCongratsMessage] = useState("")
  const [congratulations, setCongratulations] = useState<Record<number, string[]>>({})

  const getUpcomingBirthdays = (): BirthdayUser[] => {
    const today = new Date()
    return users
      .filter((user) => user.birthday)
      .map((user) => {
        const birthday = new Date(user.birthday!)
        birthday.setFullYear(today.getFullYear())
        if (birthday < today) {
          birthday.setFullYear(today.getFullYear() + 1)
        }
        const daysUntil = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const isToday = daysUntil === 0
        return { ...user, daysUntil, isToday }
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }

  const upcomingBirthdays = getUpcomingBirthdays()
  const todaysBirthdays = upcomingBirthdays.filter((user) => user.isToday)
  const upcomingOnly = upcomingBirthdays.filter((user) => !user.isToday)

  const formatBirthday = (birthday: string) => {
  // Crear la fecha usando componentes para evitar problemas de zona horaria inicial
  const [year, month, day] = birthday.split('-').map(Number);
  // Meses en JavaScript son base 0 (0 para enero, 11 para diciembre)
  // No necesitamos el año actual aquí, solo la fecha de nacimiento para formatear
  const birthdayDate = new Date(year, month - 1, day);

  // Formatear la fecha manualmente o usar toLocaleDateString con un objeto Date más fiable
  // Opción 1: Formato manual (probado y fiable)
  const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const formattedDay = birthdayDate.getDate();
  const formattedMonth = monthNames[birthdayDate.getMonth()];
  return `${formattedDay} de ${formattedMonth}`;

  
}


  const handleSendCongrats = (user: BirthdayUser) => {
    if (congratsMessage.trim()) {
      setCongratulations((prev) => ({
        ...prev,
        [user.id]: [...(prev[user.id] || []), congratsMessage.trim()],
      }))
      alert(`¡Felicitaciones enviadas a ${user.name}! 🎉`)
      setSelectedUser(null)
      setCongratsMessage("")
    }
  }

  return (
    <div>
      {/* Cumpleaños de hoy */}
      {todaysBirthdays.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Cake className="w-6 h-6 text-pink-500" />
            <h2 className="text-xl font-bold text-gray-900">¡Cumpleaños de Hoy! 🎉</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysBirthdays.map((user, index) => (
              <Card
                key={user.id}
                className="p-6 bg-gradient-to-br from-pink-50 to-orange-50 border-pink-200 animate-slideUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12 border-2 border-pink-300">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">
                      {user.department} - {user.position}
                    </p>
                    <Badge variant="secondary" className="mt-1 bg-pink-100 text-pink-700">
                      <Gift className="w-3 h-3 mr-1" />
                      ¡Hoy cumple años!
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-700">{formatBirthday(user.birthday!)}</span>
                  <span className="text-sm font-semibold text-pink-600">🎂 ¡HOY!</span>
                </div>

                {/* Mostrar felicitaciones existentes */}
                {congratulations[user.id] && congratulations[user.id].length > 0 && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-pink-200">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Felicitaciones recibidas:</h4>
                    <div className="space-y-1">
                      {congratulations[user.id].slice(0, 2).map((msg, idx) => (
                        <p key={idx} className="text-xs text-gray-600 italic">
                          "{msg}"
                        </p>
                      ))}
                      {congratulations[user.id].length > 2 && (
                        <p className="text-xs text-gray-500">+{congratulations[user.id].length - 2} más...</p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                  onClick={() => setSelectedUser(user)}
                >
                  🎉 Felicitar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Próximos cumpleaños */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Cake className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">Próximos Cumpleaños</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingOnly.map((user, index) => (
            <Card key={user.id} className="p-6 animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">
                    {user.department} - {user.position}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{formatBirthday(user.birthday!)}</span>
                <span className="text-sm font-semibold text-blue-600">
                  En {user.daysUntil} día{user.daysUntil !== 1 ? "s" : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de felicitación */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedUser.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">Felicitar a {selectedUser.name}</h3>
                  <p className="text-sm text-gray-600">🎂 ¡Hoy cumple años!</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="congrats-message">Mensaje de felicitación</Label>
                  <Textarea
                    id="congrats-message"
                    value={congratsMessage}
                    onChange={(e) => setCongratsMessage(e.target.value)}
                    placeholder="¡Feliz cumpleaños! Que tengas un día maravilloso..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleSendCongrats(selectedUser)}
                    disabled={!congratsMessage.trim()}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Enviar Felicitación 🎉
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {upcomingBirthdays.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4 grayscale-[30%]">🎂</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No hay cumpleaños próximos</div>
          <div className="text-gray-500 max-w-md mx-auto">
            Cuando se registren fechas de cumpleaños, aparecerán aquí.
          </div>
        </div>
      )}
    </div>
  )
}
