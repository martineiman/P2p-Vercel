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

interface DashboardStats {
  userStats: {
    received: number;
    sent: number;
    valuesCount: number;
    teammates: number;
  };
  metricsStats: {
    participationRate: number;
    growthRate: number; // Simulado por ahora
    totalRecognitions: number;
  };
}


export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [values, setValues] = useState<Value[]>([])
  const [recognitions, setRecognitions] = useState<Recognition[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null) // Especificamos el tipo de stats
  const [loading, setLoading] = useState(true)
  const [showRecognitionModal, setShowRecognitionModal] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log("useEffect: Llamando a loadData..."); // Log en useEffect
    loadData()
  }, [])

  const loadData = async () => {
    console.log("loadData: Iniciando carga de datos..."); // Log al inicio de loadData
    setLoading(true);
    try {
      const [usersRes, valuesRes, recognitionsRes, statsRes, currentUserRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/values"),
        fetch("/api/recognitions"),
        fetch("/api/stats"),
        fetch("/api/auth/me")
      ]);

      if (!usersRes.ok) {
        console.log("loadData: Usuario no autenticado o error, redirigiendo a login."); // Log de redirección
        router.push("/login");
        return;
      }

      const [usersData, valuesData, recognitionsData, statsData, currentUserData] = await Promise.all([
        usersRes.json(),
        valuesRes.json(),
        recognitionsRes.json(),
        statsRes.json(),
        currentUserRes.json()
      ]);

      // Asegurarse de que los datos sean arrays antes de usarlos
      const loadedRecognitions = Array.isArray(recognitionsData?.recognitions) ? recognitionsData.recognitions : [];
      const loadedUsers = Array.isArray(usersData?.users) ? usersData.users : [];
      const loadedCurrentUser = currentUserRes.ok ? currentUserData.user : null;

      console.log("loadData: Datos cargados - Usuarios:", loadedUsers.length, "Reconocimientos:", loadedRecognitions.length, "Valores:", valuesData?.values?.length, "StatsAPI:", statsData?.stats); // Log de datos cargados

      setUsers(loadedUsers);
      setValues(Array.isArray(valuesData?.values) ? valuesData.values : []);
      setRecognitions(loadedRecognitions);
      // setStats(statsData.stats); // Esto puede ser removido ya que calculamos stats localmente

      if (loadedCurrentUser) {
         // Calcular las estadísticas del usuario y métricas generales aquí
         console.log("loadData: Calculando stats del usuario y métricas generales..."); // Log antes de calcular stats
         const calculatedUserStats = getUserStats(loadedUsers, loadedRecognitions, loadedCurrentUser);
         const calculatedMetricsStats = getMetricsStats(loadedUsers, loadedRecognitions);
         setStats({ userStats: calculatedUserStats, metricsStats: calculatedMetricsStats });
         setCurrentUser(loadedCurrentUser); // Setear el usuario actual
         console.log("loadData: Stats calculados y seteados:", { userStats: calculatedUserStats, metricsStats: calculatedMetricsStats }); // Log de stats calculados
      } else {
          // Si no se pudo cargar el usuario actual, inicializar stats a 0 y currentUser a null
           console.log("loadData: Usuario actual no cargado, inicializando stats a 0."); // Log si no hay currentUser
           setStats({ userStats: { received: 0, sent: 0, valuesCount: 0, teammates: 0 }, metricsStats: { participationRate: 0, growthRate: 0, totalRecognitions: 0 } });
           setCurrentUser(null);
      }

    } catch (error) {
      console.error("loadData: Error al cargar datos:", error); // Log de error en carga
      router.push("/login");
    } finally {
      console.log("loadData: Carga de datos finalizada."); // Log al final de loadData
      setLoading(false);
    }
  }

  // Función auxiliar para calcular estadísticas del usuario
  const getUserStats = (allUsers: User[], allRecognitions: Recognition[], currentUser: User) => {
    console.log("getUserStats: Calculando estadísticas para el usuario:", currentUser?.name); // Log al inicio de getUserStats
    if (!currentUser) {
       console.log("getUserStats: currentUser es null, retornando stats a 0."); // Log si currentUser es null
       return { received: 0, sent: 0, valuesCount: 0, teammates: 0 }; // Asegurar que currentUser no sea null
    }


    const received = allRecognitions.filter((r: Recognition) => r.recipient_id === currentUser.id).length;
    const sent = allRecognitions.filter((r: Recognition) => r.sender_id === currentUser.id).length;

    const userRecognitions = allRecognitions.filter((r: Recognition) => r.recipient_id === currentUser.id);
    const valuesCount = new Set(userRecognitions.map((r: Recognition) => r.value_id)).size;

    const teammates = allUsers.filter((u: User) => u.team === currentUser.team && u.id !== currentUser.id).length;

    console.log("getUserStats: Estadísticas calculadas:", { received, sent, valuesCount, teammates }); // Log de estadísticas calculadas
    return { received, sent, valuesCount, teammates };
  }

  // Función auxiliar para calcular métricas generales
  const getMetricsStats = (allUsers: User[], allRecognitions: Recognition[]) => {
     console.log("getMetricsStats: Calculando métricas generales..."); // Log al inicio de getMetricsStats
    const totalUsers = allUsers.length;
    const activeUsers = new Set([
      ...allRecognitions.map((r: Recognition) => r.sender_id),
      ...allRecognitions.map((r: Recognition) => r.recipient_id),
    ]).size;
    const participationRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // Calcular crecimiento vs mes anterior (simulado por ahora)
    const growthRate = 23; // Esto debería calcularse comparando con datos del mes anterior

    const totalRecognitions = allRecognitions.length;

     console.log("getMetricsStats: Métricas calculadas:", { participationRate, growthRate, totalRecognitions }); // Log de métricas calculadas
    return { participationRate, growthRate, totalRecognitions };
  }

  const handleLogout = async () => {
    try {
      console.log("handleLogout: Cerrando sesión..."); // Log al inicio de logout
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      console.log("handleLogout: Sesión cerrada, redirigiendo."); // Log de redirección en logout
    } catch (error) {
      console.error("handleLogout: Error al cerrar sesión:", error); // Log de error en logout
    }
  }

  const getUpcomingBirthdays = () => {
  console.log("getUpcomingBirthdays: Calculando próximos cumpleaños..."); // Log al inicio de getUpcomingBirthdays
  const today = new Date();
  console.log("getUpcomingBirthdays: Fecha actual (today):", today); // Log 1: Fecha actual

  // Usamos el estado users, que ya está cargado y verificado en loadData
  const upcoming = users
    .filter((user) => user.birthday)
    .map((user) => {
      console.log("getUpcomingBirthdays: Usuario y fecha original:", user.name, user.birthday); // Log 2: Usuario y string de fecha original

      // Crear la fecha usando componentes para evitar problemas de zona horaria inicial
      const [year, month, day] = user.birthday!.split('-').map(Number);
      // Meses en JavaScript son base 0 (0 para enero, 11 para diciembre)
      // Creamos la fecha usando el año actual para el cálculo de días restantes
      const birthdayThisYear = new Date(today.getFullYear(), month - 1, day); // Log 3: Fecha de cumpleaños para el año actual

      console.log("getUpcomingBirthdays: Fecha de cumpleaños este año (usando componentes):", user.name, birthdayThisYear);


      // Ajustar al próximo año si ya pasó (comparando solo día, mes, año)
      const comparisonToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Crear una fecha para comparar solo día, mes, año
      console.log("getUpcomingBirthdays: Fecha de comparación hoy (solo día/mes/año):", comparisonToday);


      if (birthdayThisYear < comparisonToday) {
         birthdayThisYear.setFullYear(today.getFullYear() + 1);
         console.log("getUpcomingBirthdays: Fecha de cumpleaños ajustada al próximo año:", user.name, birthdayThisYear); // Log si se ajusta al próximo año
      }

      const daysUntil = Math.ceil((birthdayThisYear.getTime() - comparisonToday.getTime()) / (1000 * 60 * 60 * 24));
      console.log("getUpcomingBirthdays: Días restantes calculados:", user.name, daysUntil); // Log de días restantes

      return { ...user, daysUntil, birthdayDateObject: birthdayThisYear }; // Devolvemos el objeto Date para usarlo en el formato si es necesario
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

   console.log("getUpcomingBirthdays: Cumpleaños próximos ordenados:", upcoming); // Log de la lista final

   return upcoming; // Asegurarse de retornar la lista
};


  const openSection = (section: string) => {
    console.log("openSection: Abriendo sección:", section); // Log al abrir sección
    setActiveSection(section);
  }

  const closeSection = () => {
    console.log("closeSection: Cerrando sección..."); // Log al cerrar sección
    setActiveSection(null);
    setSelectedUser(null);
  }

  const handleViewUserAchievements = (user: User) => {
    console.log("handleViewUserAchievements: Viendo logros del usuario:", user.name); // Log al ver logros de usuario
    setSelectedUser(user);
    setActiveSection("user-achievements");
  }

  // Renderizar condicionalmente hasta que los datos y stats estén cargados
  if (loading || !stats || !currentUser) {
    console.log("Render: Cargando o datos/stats/currentUser no disponibles...", { loading, stats: !!stats, currentUser: !!currentUser }); // Log en estado de carga
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

   console.log("Render: Datos/stats/currentUser disponibles, renderizando dashboard principal."); // Log cuando se renderiza el dashboard principal


  // Ahora podemos acceder a userStats y metricsStats desde el estado stats
  const { userStats, metricsStats } = stats;
  const upcomingBirthdays = getUpcomingBirthdays(); // getUpcomingBirthdays usa el estado users, que ya está cargado y verificado


  if (activeSection) {
     console.log("Render: Renderizando sección activa:", activeSection); // Log si hay sección activa
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
            // Pasar users y recognitions a MetricsSection
            <MetricsSection medals={recognitions} users={users} currentUser={currentUser!} />
          )}
          {activeSection === "values" && <ValuesSection values={values} />}
           {activeSection === "adn" && (
             // Pasar los props correctos a ADNSection
            <ADNSection medals={recognitions} currentUser={currentUser!} values={values} users={users} />
          )}
          {activeSection === "achievements" && (
             // Pasar los props correctos a AchievementsSection
            <AchievementsSection
              medals={recognitions}
              currentUser={currentUser!}
              users={users}
              values={values}
              onRefreshData={loadData} // Pasamos loadData para refrescar datos
            />
          )}
          {activeSection === "search" && (
            // Pasar los props correctos a PeopleSearchSection
            <PeopleSearchSection
              users={users}
              medals={recognitions}
              values={values}
              currentUser={currentUser!}
              onViewAchievements={handleViewUserAchievements}
            />
          )}
          {activeSection === "user-achievements" && selectedUser && (
             // Pasar los props correctos a UserAchievementsSection
            <UserAchievementsSection
              user={selectedUser}
              medals={recognitions}
              users={users}
              values={values}
              currentUser={currentUser!}
              onRefreshData={loadData} // Pasamos loadData para refrescar datos
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
              {/* Usamos userStats del estado */}
              <div className="text-4xl font-extrabold mb-2">{stats.userStats.received}</div>
              <div className="text-orange-100 font-medium">Reconocimientos Recibidos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6 text-center">
               {/* Usamos userStats del estado */}
              <div className="text-4xl font-extrabold mb-2">{stats.userStats.sent}</div>
              <div className="text-green-100 font-medium">Reconocimientos Dados</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6 text-center">
               {/* Usamos userStats del estado */}
              <div className="text-4xl font-extrabold mb-2">{stats.userStats.valuesCount}</div>
              <div className="text-amber-100 font-medium">Valores Reconocidos</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6 text-center">
               {/* Usamos userStats del estado */}
              <div className="text-4xl font-extrabold mb-2">{stats.userStats.teammates}</div>
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
              {/* upcomingBirthdays usa el estado users, que ya está cargado */}
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
                       {/* Usamos el objeto Date del user retornado por getUpcomingBirthdays para formatear */}
                       {upcomingBirthdays[0].birthdayDateObject && (
                        <div className="text-[10px] text-gray-600">
                           {upcomingBirthdays[0].birthdayDateObject.toLocaleDateString("es-ES", { // Usamos toLocaleDateString aquí
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                       )}
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
                 {/* Usamos metricsStats del estado */}
                <div className="text-center">
                  <div className="text-base font-extrabold text-orange-600 mb-1">{stats.metricsStats.participationRate}%</div>
                  <div className="text-[8px] text-gray-600 uppercase tracking-wider">Participación</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-extrabold text-orange-600 mb-1">+{stats.metricsStats.growthRate}%</div>
                  <div className="text-[8px] text-gray-600 uppercase tracking-wider">vs Mes Anterior</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-extrabold text-orange-600 mb-1">{stats.metricsStats.totalRecognitions}</div>
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
              {/* Usamos recognitions del estado, que ya está cargado */}
              <div className="text-xs text-gray-600">
                {recognitions.filter((r: Recognition) => r.recipient_id === currentUser?.id).length} reconocimientos recibidos
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
          users={users} // Usamos el estado users, que ya está cargado
          values={values} // Usamos el estado values, que ya está cargado
          currentUser={currentUser} // Usamos el estado currentUser, que ya está cargado
          onClose={() => {
             console.log("RecognitionModal: Modal cerrado."); // Log al cerrar modal
             setShowRecognitionModal(false);
          }}
          onSuccess={() => {
            console.log("RecognitionModal: Reconocimiento enviado exitosamente, llamando onSuccess..."); // Log al enviar exitosamente
            setShowRecognitionModal(false)
            loadData() // Recargar datos después de un reconocimiento exitoso
          }}
        />
      )}
    </div>
  )
}
