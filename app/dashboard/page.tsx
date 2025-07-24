"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Award, LogOut, Star, Crown, Activity, Dna, MedalIcon, Search, Cake } from "lucide-react"
import { RecognitionModal } from "@/components/recognition-modal"
import { MetricsSection } from "@/components/metrics-section"
import { BirthdaysSection } from "@/components/birthdays-section"
import { DestacadosSection } from "@/components/destacados-section"
import { ValuesSection } from "@/components/values-section"
import { ADNSection } from "@/components/adn-section"
import { AchievementsSection } from "@/components/achievements-section"
import { PeopleSearchSection } from "@/components/people-search-section"
import { UserAchievementsSection } from "@/components/user-achievements-section"
import type { User, Value, Recognition } from "@/lib/database"

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [values, setValues] = useState<Value[]>([])
  const [recognitions, setRecognitions] = useState<Recognition[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showRecognitionModal, setShowRecognitionModal] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, valuesRes, recognitionsRes, statsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/values"),
        fetch("/api/recognitions"),
        fetch("/api/stats"),
      ])

      if (!usersRes.ok) {
        router.push("/login")
        return
      }

      const [usersData, valuesData, recognitionsData, statsData] = await Promise.all([
        usersRes.json(),
        valuesRes.json(),
        recognitionsRes.json(),
        statsRes.json(),
      ])

      setUsers(usersData.users)
      setValues(valuesData.values)
      setRecognitions(recognitionsData.recognitions)
      setStats(statsData.stats)

      const currentUserRes = await fetch("/api/auth/me")
      if (currentUserRes.ok) {
        const currentUserData = await currentUserRes.json()
        setCurrentUser(currentUserData.user)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const getUpcomingBirthdays = () => {
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
        return { ...user, daysUntil }
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }

  const getUserStats = () => {
    if (!currentUser) return { received: 0, sent: 0, valuesCount: 0, teammates: 0 }

    const received = recognitions.filter((r: any) => r.recipient_id === currentUser.id).length
    const sent = recognitions.filter((r: any) => r.sender_id === currentUser.id).length

    const userRecognitions = recognitions.filter((r: any) => r.recipient_id === currentUser.id)
    const valuesCount = new Set(userRecognitions.map((r: any) => r.value_id)).size

    const teammates = users.filter((u) => u.team === currentUser.team && u.id !== currentUser.id).length

    return { received, sent, valuesCount, teammates }
  }

  const getMetricsStats = () => {
    const totalUsers = users.length
    const activeUsers = new Set([
      ...recognitions.map((r: any) => r.sender_id),
      ...recognitions.map((r: any) => r.recipient_id),
    ]).size
    const participationRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

    // Calcular crecimiento vs mes anterior (simulado por ahora)
    const growthRate = 23 // Esto debería calcularse comparando con datos del mes anterior

    const totalRecognitions = recognitions.length

    return { participationRate, growthRate, totalRecognitions }
  }

  const openSection = (section: string) => {
    setActiveSection(section)
  }

  const closeSection = () => {
    setActiveSection(null)
    setSelectedUser(null)
  }

  const handleViewUserAchievements = (user: User) => {
    setSelectedUser(user)
    setActiveSection("user-achievements")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  const upcomingBirthdays = getUpcomingBirthdays()
  const userStats = getUserStats()
  const metricsStats = getMetricsStats()

  if (activeSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={closeSection}>
                  ← Volver
                </Button>
                <h1 className="text-xl font-bold text-gray-900 capitalize">
                  {activeSection === "user-achievements" ? `Logros de ${selectedUser?.name}` : activeSection}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {currentUser && (
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={currentUser.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {currentUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">{currentUser.department}</p>
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === "birthdays" && <BirthdaysSection users={users} />}
          {activeSection === "destacados" && (
            <DestacadosSection medals={recognitions} users={users} onViewAchievements={handleViewUserAchievements} />
          )}
          {activeSection === "metrics" && (
            <MetricsSection medals={recognitions} users={users} currentUser={currentUser!} />
          )}
          {activeSection === "values" && <ValuesSection values={values} />}
          {activeSection === "adn" && (
            <ADNSection medals={recognitions} currentUser={currentUser!} values={values} users={users} />
          )}
          {activeSection === "achievements" && (
            <AchievementsSection
              medals={recognitions}
              currentUser={currentUser!}
              users={users}
              values={values}
              onRefreshData={loadData}
            />
          )}
          {activeSection === "search" && (
            <PeopleSearchSection
              users={users}
              medals={recognitions}
              values={values}
              currentUser={currentUser!}
              onViewAchievements={handleViewUserAchievements}
            />
          )}
          {activeSection === "user-achievements" && selectedUser && (
            <UserAchievementsSection
              user={selectedUser}
              medals={recognitions}
              users={users}
              values={values}
              currentUser={currentUser!}
              onRefreshData={loadData}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Reconocimientos</h1>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={currentUser.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.department}</p>
                  </div>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Fila superior con colores específicos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold mb-2">{userStats.received}</div>
              <div className="text-orange-100 font-medium">Reconocimientos Recibidos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold mb-2">{userStats.sent}</div>
              <div className="text-green-100 font-medium">Reconocimientos Dados</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold mb-2">{userStats.valuesCount}</div>
              <div className="text-amber-100 font-medium">Valores Reconocidos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold mb-2">{userStats.teammates}</div>
              <div className="text-red-100 font-medium">Compañeros de Equipo</div>
            </CardContent>
          </Card>
        </div>

        {/* Sections Grid - Cuadrícula de 8 tarjetas funcionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Cumpleaños - Corregida para mostrar el próximo cumpleaños */}
          <div
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden"
            onClick={() => openSection("birthdays")}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-orange-500"></div>
            <div className="text-2xl mb-2">
              <Cake className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Cumpleaños</h3>
              {upcomingBirthdays[0] ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={upcomingBirthdays[0].avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {upcomingBirthdays[0].name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{upcomingBirthdays[0].name}</div>
                      <div className="text-[10px] text-gray-600">
                        {upcomingBirthdays[0].birthday &&
                          new Date(upcomingBirthdays[0].birthday).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-center text-pink-600">
                    {upcomingBirthdays[0].daysUntil === 0
                      ? "¡Hoy!"
                      : `En ${upcomingBirthdays[0].daysUntil} día${upcomingBirthdays[0].daysUntil !== 1 ? "s" : ""}`}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">No hay cumpleaños próximos</div>
              )}
            </div>
          </div>

          {/* Destacados */}
          <div
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden"
            onClick={() => openSection("destacados")}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
            <div className="text-2xl mb-2">
              <Crown className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Destacados</h3>
              <div className="text-xs text-gray-600">Los más reconocidos del mes</div>
            </div>
          </div>

          {/* Métricas - Actualizada con los valores correctos */}
          <div
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden"
            onClick={() => openSection("metrics")}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700"></div>
            <div className="text-2xl mb-2">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Métricas</h3>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-center">
                  <div className="text-base font-extrabold text-orange-600 mb-1">{metricsStats.participationRate}%</div>
                  <div className="text-[8px] text-gray-600 uppercase tracking-wider">Participación</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-extrabold text-orange-600 mb-1">+{metricsStats.growthRate}%</div>
                  <div className="text-[8px] text-gray-600 uppercase tracking-wider">vs Mes Anterior</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-extrabold text-orange-600 mb-1">{metricsStats.totalRecognitions}</div>
                  <div className="text-[8px] text-gray-600 uppercase tracking-wider">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden"
            onClick={() => openSection("values")}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-700"></div>
            <div className="text-2xl mb-2">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Valores</h3>
              <div className="grid grid-cols-2 gap-1">
                {values.slice(0, 4).map((value) => (
                  <div key={value.name} className="flex items-center gap-1 text-xs font-medium text-gray-700">
                    <span>{value.icon}</span>
                    <span className="truncate">{value.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ADN */}
          <div
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden"
            onClick={() => openSection("adn")}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-700"></div>
            <div className="text-2xl mb-2">
              <Dna className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-2">ADN</h3>
              <div className="text-xs text-gray-600">Tu perfil de valores y el de tu equipo</div>
            </div>
          </div>

          {/* Logros */}
          <div
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden"
            onClick={() => openSection("achievements")}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-700"></div>
            <div className="text-2xl mb-2">
              <MedalIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Logros</h3>
              <div className="text-xs text-gray-600">
                {recognitions.filter((r: any) => r.recipient_id === currentUser?.id).length} reconocimientos recibidos
              </div>
            </div>
          </div>

          {/* Búsqueda */}
          <div
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden"
            onClick={() => openSection("search")}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-cyan-700"></div>
            <div className="text-2xl mb-2">
              <Search className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Buscar</h3>
              <div className="text-xs text-gray-600">Explora perfiles y logros</div>
            </div>
          </div>

          {/* Reconocimiento */}
          <div
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden"
            onClick={() => setShowRecognitionModal(true)}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-700"></div>
            <div className="text-2xl mb-2">
              <Star className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Reconocer</h3>
              <div className="text-xs text-gray-600">Envía un reconocimiento</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recognition Modal */}
      {showRecognitionModal && (
        <RecognitionModal
          users={users}
          values={values}
          currentUser={currentUser}
          onClose={() => setShowRecognitionModal(false)}
          onSuccess={() => {
            setShowRecognitionModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
