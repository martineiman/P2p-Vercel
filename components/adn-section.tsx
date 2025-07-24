"use client"

import { useState, useMemo } from "react"
import type { Recognition, User, Value } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ADNSectionProps {
  medals: Recognition[]
  currentUser: User
  values: Value[]
  users: User[]
}

export function ADNSection({ medals, currentUser, values, users }: ADNSectionProps) {
  const [viewMode, setViewMode] = useState("individual")
  const [timeframe, setTimeframe] = useState("all")

  // Filtrar medallas del usuario actual
  const userMedals = medals.filter((m: any) => m.recipient_id === currentUser.id)

  // Calcular estadísticas individuales
  const individualStats = useMemo(() => {
    const valueCounts: Record<number, number> = {}
    userMedals.forEach((m: any) => {
      valueCounts[m.value_id] = (valueCounts[m.value_id] || 0) + 1
    })

    const totalRecognitions = userMedals.length

    return {
      totalRecognitions,
      segments:
        totalRecognitions > 0
          ? Object.entries(valueCounts)
              .map(([valueId, count]) => {
                const valueData = values.find((v) => v.id === Number.parseInt(valueId))
                return {
                  value: valueData?.name || "Desconocido",
                  count,
                  percentage: (count / totalRecognitions) * 100,
                  color: valueData?.color || "#CCCCCC",
                  icon: valueData?.icon || "🏆",
                  description: valueData?.description || "",
                }
              })
              .sort((a, b) => b.percentage - a.percentage)
          : [],
    }
  }, [userMedals, values])

  const currentStats = individualStats

  return (
    <div>
      {/* Controles */}
      <div className="flex flex-wrap gap-4 mb-6 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Vista</label>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("individual")}
              variant={viewMode === "individual" ? "default" : "outline"}
              className={viewMode === "individual" ? "bg-gradient-to-br from-orange-600 to-orange-700" : ""}
            >
              Individual
            </Button>
            <Button
              onClick={() => setViewMode("team")}
              variant={viewMode === "team" ? "default" : "outline"}
              className={viewMode === "team" ? "bg-gradient-to-br from-orange-600 to-orange-700" : ""}
            >
              Equipo
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Período</label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecciona período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-h-[400px]">
          {currentStats.segments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4 grayscale-[30%]">🌱</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">Aún no tienes reconocimientos</div>
              <div className="text-gray-500 max-w-md mx-auto">
                ¡Es hora de que tu ADN comience a brillar! Cuando recibas reconocimientos, aparecerán aquí organizados
                por valores.
              </div>
            </div>
          ) : (
            <div className="w-full p-4">
              {currentStats.segments.map((segment, index) => (
                <div
                  key={segment.value}
                  className="relative pl-12 mb-8 animate-slideUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className="absolute left-5 top-3 w-5 h-5 rounded-full border-4 border-white z-10"
                    style={{
                      boxShadow: `0 0 0 3px ${segment.color}`,
                      backgroundColor: segment.color,
                    }}
                  />
                  {index < currentStats.segments.length - 1 && (
                    <div
                      className="absolute left-[22px] top-0 bottom-[-32px] w-[3px] rounded-sm"
                      style={{
                        background: `linear-gradient(180deg, ${segment.color}, ${currentStats.segments[index + 1].color})`,
                      }}
                    />
                  )}
                  <div
                    className="bg-white p-5 rounded-xl shadow border-l-4 transition-all hover:shadow-xl hover:translate-x-2 hover:translate-y-[-2px]"
                    style={{ borderLeftColor: segment.color }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>
                          {segment.icon}
                        </span>
                        <span className="font-semibold text-gray-900">{segment.value}</span>
                      </div>
                      <div
                        className="font-extrabold text-xl"
                        style={{ color: segment.color, textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
                      >
                        {segment.percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {segment.count} reconocimiento{segment.count !== 1 ? "s" : ""} recibido
                      {segment.count !== 1 ? "s" : ""}
                      <br />
                      <em>{segment.description}</em>
                    </div>
                    <div className="h-2 bg-gray-100 rounded overflow-hidden relative">
                      <div
                        className="h-full rounded transition-all duration-2000 ease-out"
                        style={{
                          background: `linear-gradient(90deg, ${segment.color}99, ${segment.color})`,
                          width: `${segment.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar con información */}
        <div className="w-full lg:w-80 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Valores</h3>
          {currentStats.segments.map((segment) => (
            <div
              key={segment.value}
              className="flex items-center gap-3 mb-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md hover:translate-y-[-2px]"
            >
              <div className="w-[18px] h-[18px] rounded-full shadow-sm" style={{ backgroundColor: segment.color }} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">
                  {segment.icon} {segment.value}
                </div>
                <div className="text-xs text-gray-600">
                  {segment.count} reconocimiento{segment.count !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-sm font-bold text-gray-900">{segment.percentage.toFixed(1)}%</div>
            </div>
          ))}

          {/* Análisis del ADN */}
          {currentStats.segments.length > 0 && (
            <div className="mt-6 p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-l-4 border-amber-500 shadow-sm">
              <h4 className="font-semibold text-amber-900 mb-2">💡 Análisis del ADN</h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                Tu fortaleza principal es <strong>{currentStats.segments[0].value}</strong> con un{" "}
                {currentStats.segments[0].percentage.toFixed(1)}% de tus reconocimientos.
                {currentStats.segments.length > 1 && (
                  <span>
                    {" "}
                    También destacas en <strong>{currentStats.segments[1].value}</strong> (
                    {currentStats.segments[1].percentage.toFixed(1)}%).
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
