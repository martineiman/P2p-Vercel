"use client"

import { useState, useEffect } from "react"
import type { Recognition, User, Value } from "@/lib/database"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Send } from "lucide-react"

interface UserAchievementsSectionProps {
  user: User
  medals: Recognition[]
  users: User[]
  values: Value[]
  currentUser: User
  onRefreshData: () => void
}

interface RecognitionWithInteractions extends Recognition {
  likes: number
  comments: Array<{
    id: number
    user_name: string
    content: string
    created_at: string
  }>
  isLiked: boolean
}

export function UserAchievementsSection({
  user,
  medals,
  users,
  values,
  currentUser,
  onRefreshData,
}: UserAchievementsSectionProps) {
  const [recognitionsWithInteractions, setRecognitionsWithInteractions] = useState<RecognitionWithInteractions[]>([])
  const [newComments, setNewComments] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)

  // Filtrar reconocimientos del usuario una sola vez
  const userRecognitions = medals.filter((m: any) => m.recipient_id === user.id)

  useEffect(() => {
    // Solo ejecutar cuando cambie el ID del usuario o la longitud de reconocimientos
    const loadInteractions = () => {
      const recognitionsWithData = userRecognitions.map((recognition: any) => ({
        ...recognition,
        likes: Math.floor(Math.random() * 10) + 1,
        comments: [
          {
            id: 1,
            user_name: "Ana Martinez",
            content: "¡Totalmente de acuerdo! María siempre está dispuesta a ayudar.",
            created_at: "15 dic, 08:00",
          },
        ].filter(() => Math.random() > 0.5),
        isLiked: Math.random() > 0.5,
      }))

      setRecognitionsWithInteractions(recognitionsWithData)
    }

    loadInteractions()
  }, [user.id, userRecognitions.length]) // Dependencias específicas

  const handleLike = async (recognitionId: number) => {
    setRecognitionsWithInteractions((prev) =>
      prev.map((r) =>
        r.id === recognitionId
          ? {
              ...r,
              likes: r.isLiked ? r.likes - 1 : r.likes + 1,
              isLiked: !r.isLiked,
            }
          : r,
      ),
    )
  }

  const handleComment = async (recognitionId: number) => {
    const comment = newComments[recognitionId]
    if (!comment?.trim()) return

    setLoading(true)

    setTimeout(() => {
      setRecognitionsWithInteractions((prev) =>
        prev.map((r) =>
          r.id === recognitionId
            ? {
                ...r,
                comments: [
                  ...r.comments,
                  {
                    id: Date.now(),
                    user_name: currentUser.name,
                    content: comment,
                    created_at: "Ahora",
                  },
                ],
              }
            : r,
        ),
      )

      setNewComments((prev) => ({ ...prev, [recognitionId]: "" }))
      setLoading(false)
    }, 500)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vitrina de Logros</h2>
            <p className="text-gray-600">{user.name}</p>
            <p className="text-sm text-gray-500">
              {user.department} - {user.position}
            </p>
          </div>
        </div>
        <p className="text-gray-600">
          {userRecognitions.length} reconocimiento{userRecognitions.length !== 1 ? "s" : ""} recibido
          {userRecognitions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-6">
        {recognitionsWithInteractions.map((recognition, index) => {
          const sender = users.find((u) => u.id === recognition.sender_id)
          const value = values.find((v) => v.id === recognition.value_id)

          return (
            <Card key={recognition.id} className="p-6 animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={sender?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {sender?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Enviado por: <span className="font-bold">{sender?.name || "Usuario desconocido"}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(recognition.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {value && (
                  <Badge variant="secondary" className="text-xs">
                    {value.icon} {value.name}
                  </Badge>
                )}
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Motivo:</h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                  "{recognition.message}"
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(recognition.id)}
                    className={`flex items-center gap-2 ${recognition.isLiked ? "text-red-500" : "text-gray-500"}`}
                  >
                    <Heart className={`w-4 h-4 ${recognition.isLiked ? "fill-current" : ""}`} />
                    {recognition.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    {recognition.comments.length}
                  </Button>
                </div>

                {recognition.comments.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Comentarios:</h5>
                    <div className="space-y-2">
                      {recognition.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{comment.user_name}</span>
                            <span className="text-xs text-gray-500">{comment.created_at}</span>
                          </div>
                          <p className="text-sm text-gray-600">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escribe un comentario..."
                    value={newComments[recognition.id] || ""}
                    onChange={(e) => setNewComments((prev) => ({ ...prev, [recognition.id]: e.target.value }))}
                    className="flex-1 min-h-[60px]"
                  />
                  <Button
                    onClick={() => handleComment(recognition.id)}
                    disabled={!newComments[recognition.id]?.trim() || loading}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {userRecognitions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4 grayscale-[30%]">🏆</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">{user.name} aún no tiene logros</div>
          <div className="text-gray-500 max-w-md mx-auto">
            Cuando reciba reconocimientos de sus compañeros, aparecerán aquí como logros.
          </div>
        </div>
      )}
    </div>
  )
}
