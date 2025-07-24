"use client"

import { useState } from "react"
import type { Recognition, User } from "@/lib/database"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MetricsSectionProps {
  medals: Recognition[]
  users: User[]
  currentUser: User
}

export function MetricsSection({ medals, users, currentUser }: MetricsSectionProps) {
  const [viewType, setViewType] = useState("employee")
  const [selectedEntity, setSelectedEntity] = useState(currentUser.id.toString())

  const getRecognitionStats = () => {
    const sent = medals.filter((m: any) => m.sender_id === currentUser.id).length
    const received = medals.filter((m: any) => m.recipient_id === currentUser.id).length
    const total = medals.length
    const activeUsers = new Set([...medals.map((m: any) => m.sender_id), ...medals.map((m: any) => m.recipient_id)])
      .size
    const participationRate = Math.round((activeUsers / users.length) * 100)

    return { sent, received, total, participationRate }
  }

  const getNetworkData = () => {
    // Crear nodos (usuarios)
    const nodes = users.map((user) => ({
      id: user.id,
      name: user.name,
      department: user.department,
      area: user.area || user.department,
      team: user.team || user.department,
      sent: medals.filter((m: any) => m.sender_id === user.id).length,
      received: medals.filter((m: any) => m.recipient_id === user.id).length,
    }))

    // Crear conexiones (reconocimientos)
    const connections = medals.map((medal: any) => ({
      from: medal.sender_id,
      to: medal.recipient_id,
      count: 1,
    }))

    // Agrupar conexiones por par de usuarios
    const groupedConnections: Record<string, number> = {}
    connections.forEach((conn) => {
      const key = `${conn.from}-${conn.to}`
      groupedConnections[key] = (groupedConnections[key] || 0) + conn.count
    })

    return { nodes, connections: groupedConnections }
  }

  const stats = getRecognitionStats()
  const networkData = getNetworkData()

  return (
    <div>
      <div className="mb-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de vista</Label>
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo de vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Por Empleado</SelectItem>
                <SelectItem value="team">Por Equipo</SelectItem>
                <SelectItem value="area">Por Área</SelectItem>
                <SelectItem value="all">Vista General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewType === "employee" && (
            <div className="space-y-2">
              <Label>Seleccionar empleado</Label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} - {user.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Red Simulado */}
      <div className="w-full h-[400px] border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Red de Reconocimientos</h3>

          {/* Nodos simulados */}
          <div className="relative w-full h-full">
            {networkData.nodes.slice(0, 6).map((node, index) => {
              const angle = (index * 2 * Math.PI) / 6
              const radius = 120
              const x = 50 + (radius * Math.cos(angle)) / 3
              const y = 50 + (radius * Math.sin(angle)) / 3

              return (
                <div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {/* Nodo */}
                  <div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white"
                    title={node.name}
                  >
                    {node.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  {/* Etiqueta */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-xs font-semibold text-gray-700 whitespace-nowrap">{node.name}</div>
                    <div className="text-xs text-gray-500">{node.department}</div>
                    <div className="text-xs text-orange-600 font-bold">
                      ↑{node.sent} ↓{node.received}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Conexiones simuladas */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
                </marker>
              </defs>

              {/* Líneas de conexión simuladas */}
              <line
                x1="20%"
                y1="30%"
                x2="80%"
                y2="70%"
                stroke="#f97316"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                opacity="0.7"
              />
              <line
                x1="50%"
                y1="20%"
                x2="30%"
                y2="80%"
                stroke="#f97316"
                strokeWidth="3"
                markerEnd="url(#arrowhead)"
                opacity="0.8"
              />
              <line
                x1="70%"
                y1="40%"
                x2="40%"
                y2="60%"
                stroke="#f97316"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                opacity="0.6"
              />

              {/* Etiquetas de cantidad en las flechas */}
              <text x="50%" y="45%" fill="#f97316" fontSize="12" fontWeight="bold" textAnchor="middle">
                3
              </text>
              <text x="40%" y="50%" fill="#f97316" fontSize="12" fontWeight="bold" textAnchor="middle">
                5
              </text>
              <text x="55%" y="50%" fill="#f97316" fontSize="12" fontWeight="bold" textAnchor="middle">
                2
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-4 text-lg font-medium">Estadísticas Detalladas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-3xl font-extrabold text-orange-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Reconocimientos</div>
            <div className="text-xs text-gray-500 mt-1">En toda la plataforma</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-extrabold text-green-600">{stats.received}</div>
            <div className="text-sm text-gray-600">Recibidos por ti</div>
            <div className="text-xs text-gray-500 mt-1">Reconocimientos que has recibido</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-extrabold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">Enviados por ti</div>
            <div className="text-xs text-gray-500 mt-1">Reconocimientos que has dado</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-extrabold text-purple-600">{stats.participationRate}%</div>
            <div className="text-sm text-gray-600">Participación Activa</div>
            <div className="text-xs text-gray-500 mt-1">Usuarios que han participado</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
