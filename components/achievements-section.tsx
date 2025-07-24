"use client"

import type { Recognition, User, Value } from "@/lib/database"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AchievementsSectionProps {
  medals: Recognition[]
  currentUser: User
  users: User[]
  values: Value[]
  onRefreshData: () => void
}

export function AchievementsSection({ medals, currentUser, users, values, onRefreshData }: AchievementsSectionProps) {
  const userRecognitions = medals.filter((m: any) => m.recipient_id === currentUser.id)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Logros</h2>
        <p className="text-gray-600">
          Has recibido {userRecognitions.length} reconocimiento{userRecognitions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-4">
        {userRecognitions.map((recognition: any, index) => {
          const sender = users.find((u) => u.id === recognition.sender_id)
          const value = values.find((v) => v.id === recognition.value_id)

          return (
            <Card key={recognition.id} className="p-6 animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={sender?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {sender?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="text-sm font-medium text-gray-900">{sender?.name || "Usuario desconocido"}</p>
                    <span className="text-sm text-gray-500">te reconoció por</span>
                    {value && (
                      <Badge variant="secondary" className="text-xs">
                        {value.icon} {value.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{recognition.message}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{new Date(recognition.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {userRecognitions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4 grayscale-[30%]">🏆</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">Aún no tienes logros</div>
          <div className="text-gray-500 max-w-md mx-auto">
            Cuando recibas reconocimientos de tus compañeros, aparecerán aquí como tus logros.
          </div>
        </div>
      )}
    </div>
  )
}
