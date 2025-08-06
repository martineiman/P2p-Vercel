"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { X, Loader2 } from "lucide-react"
import type { User, Value } from "@/lib/database"

interface RecognitionModalProps {
  users: User[]
  values: Value[]
  currentUser: User | null
  onClose: () => void
  onSuccess: () => void
}

export function RecognitionModal({ users, values, currentUser, onClose, onSuccess }: RecognitionModalProps) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedValueId, setSelectedValueId] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleSubmit: Intentando enviar reconocimiento..."); // Log al inicio de handleSubmit
    setLoading(true)

    try {
      const response = await fetch("/api/recognitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: Number.parseInt(selectedUserId),
          valueId: Number.parseInt(selectedValueId),
          message,
        }),
      })

      if (response.ok) {
        console.log("handleSubmit: Reconocimiento enviado exitosamente. Llamando onSuccess..."); // Log antes de onSuccess
        onSuccess()
      } else {
        const data = await response.json()
        console.error("handleSubmit: Error al enviar reconocimiento:", data.error); // Log de error al enviar
        alert(data.error || "Error al enviar reconocimiento")
      }
    } catch (error) {
      console.error("handleSubmit: Error de conexión al enviar reconocimiento:", error); // Log de error de conexión
      alert("Error de conexión")
    } finally {
      console.log("handleSubmit: Proceso de envío de reconocimiento finalizado."); // Log al final de handleSubmit
      setLoading(false)
    }
  }

  const selectedUser = users.find((u) => u.id.toString() === selectedUserId)
  const selectedValue = values.find((v) => v.id.toString() === selectedValueId)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Enviar Reconocimiento</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Preview */}
            {selectedUser && selectedValue && message && (
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Vista previa:</h3>
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarImage src={currentUser?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {currentUser?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium">{currentUser?.name}</span>
                      <span className="text-sm text-gray-500">reconoció a</span>
                      <span className="text-sm font-medium">{selectedUser.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedValue.icon} {selectedValue.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label htmlFor="recipient">¿A quién quieres reconocer?</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una persona" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => user.id !== currentUser?.id)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                          {user.department && <span className="text-xs text-gray-500">({user.department})</span>}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Selection */}
            <div className="space-y-2">
              <Label htmlFor="value">¿Por qué valor lo reconoces?</Label>
              <div className="grid grid-cols-2 gap-3">
                {values.map((value) => (
                  <div
                    key={value.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedValueId === value.id.toString()
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedValueId(value.id.toString())}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{value.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{value.name}</p>
                        <p className="text-xs text-gray-500">{value.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje de reconocimiento</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe por qué merece este reconocimiento..."
                className="min-h-[100px]"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!selectedUserId || !selectedValueId || !message || loading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Reconocimiento"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
