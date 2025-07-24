"use client"

import { useState } from "react"
import type { Recognition, User, Value } from "@/lib/database"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PeopleSearchSectionProps {
  users: User[]
  medals: Recognition[]
  values: Value[]
  currentUser: User
  onViewAchievements: (user: User) => void
}

export function PeopleSearchSection({
  users,
  medals,
  values,
  currentUser,
  onViewAchievements,
}: PeopleSearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.id !== currentUser.id &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase()))),
  )

  const getUserStats = (userId: number) => {
    const userMedals = medals.filter((m: any) => m.recipient_id === userId)
    const valueCounts: Record<number, number> = {}

    userMedals.forEach((medal: any) => {
      valueCounts[medal.value_id] = (valueCounts[medal.value_id] || 0) + 1
    })

    return {
      total: userMedals.length,
      values: Object.entries(valueCounts)
        .map(([valueId, count]) => ({
          value: values.find((v) => v.id === Number.parseInt(valueId))?.name || "Desconocido",
          count,
          color: values.find((v) => v.id === Number.parseInt(valueId))?.color || "#gray",
          icon: values.find((v) => v.id === Number.parseInt(valueId))?.icon || "🏆",
        }))
        .sort((a, b) => b.count - a.count),
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Buscar por nombre, departamento o cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user, index) => {
          const stats = getUserStats(user.id)
          return (
            <Card
              key={user.id}
              className="p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 animate-slideUp"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onViewAchievements(user)}
            >
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
                <span className="text-sm text-gray-500">
                  {stats.total} reconocimiento{stats.total !== 1 ? "s" : ""}
                </span>
                <div className="flex gap-1">
                  {stats.values.map((value, index) => (
                    <span key={index} className="text-xs" title={`${value.value}: ${value.count}`}>
                      {value.icon}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Ver vitrina de logros
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredUsers.length === 0 && searchTerm && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4 grayscale-[30%]">🔍</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No se encontraron resultados</div>
          <div className="text-gray-500 max-w-md mx-auto">
            Intenta con otros términos de búsqueda. Puedes buscar por nombre, departamento o cargo.
          </div>
        </div>
      )}
    </div>
  )
}
