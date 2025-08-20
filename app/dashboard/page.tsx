"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Award, LogOut, Star, Crown, Activity, Dna, MedalIcon, Search, Cake } from "lucide-react";
import { RecognitionModal } from "@/components/recognition-modal";
import { BirthdaysSection } from "@/components/birthdays-section";
import { DestacadosSection } from "@/components/destacados-section";
import { ValuesSection } from "@/components/values-section";
import { ADNSection } from "@/components/adn-section";
import { AchievementsSection } from "@/components/achievements-section";
import { PeopleSearchSection } from "@/components/people-search-section";
import { UserAchievementsSection } from "@/components/user-achievements-section";
import type { User, Value, Recognition } from "@/lib/database";

const MetricsSection = dynamic(() => import("@/components/metrics-section"), { ssr: false });

interface DashboardStats {
  userStats: {
    received: number;
    sent: number;
    valuesCount: number;
    teammates: number;
  };
  metricsStats: {
    participationRate: number | null;
    growthRate: number | null;
    totalRecognitions: number | null;
  } | null;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [values, setValues] = useState<Value[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecognitionModal, setShowRecognitionModal] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, valuesRes, recognitionsRes, statsRes, currentUserRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/values"),
        fetch("/api/recognitions"),
        fetch("/api/stats"),
        fetch("/api/auth/me"),
      ]);

      if (!usersRes.ok) {
        router.push("/login");
        return;
      }

      const [usersData, valuesData, recognitionsData, statsData, currentUserData] = await Promise.all([
        usersRes.json(),
        valuesRes.json(),
        recognitionsRes.json(),
        statsRes.json(),
        currentUserRes.json(),
      ]);

      const loadedRecognitions = Array.isArray(recognitionsData?.recognitions) ? recognitionsData.recognitions : [];
      const loadedUsers = Array.isArray(usersData?.users) ? usersData.users : [];
      const loadedCurrentUser = currentUserRes.ok ? currentUserData.user : null;

      setUsers(loadedUsers);
      setValues(Array.isArray(valuesData?.values) ? valuesData.values : []);
      setRecognitions(loadedRecognitions);

      if (loadedCurrentUser) {
        const calculatedUserStats = getUserStats(loadedUsers, loadedRecognitions, loadedCurrentUser);
        const calculatedMetricsStats = getMetricsStats(loadedUsers, loadedRecognitions);
        setStats({ userStats: calculatedUserStats, metricsStats: calculatedMetricsStats });
        loadedCurrentUser.is_admin = !!loadedCurrentUser.is_admin;
        setCurrentUser(loadedCurrentUser);
        console.log("loadData: Usuario actual cargado, es admin?", loadedCurrentUser.is_admin);
      } else {
        setStats({ userStats: { received: 0, sent: 0, valuesCount: 0, teammates: 0 }, metricsStats: null });
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("loadData: Error al cargar datos:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = (allUsers: User[], allRecognitions: Recognition[], currentUser: User) => {
    if (!currentUser) {
      return { received: 0, sent: 0, valuesCount: 0, teammates: 0 };
    }

    const received = allRecognitions.filter((r: Recognition) => r.recipient_id === currentUser.id).length;
    const sent = allRecognitions.filter((r: Recognition) => r.sender_id === currentUser.id).length;

    const userRecognitions = allRecognitions.filter((r: Recognition) => r.recipient_id === currentUser.id);
    const valuesCount = new Set(userRecognitions.map((r: Recognition) => r.value_id)).size;

    const teammates = allUsers.filter((u: User) => u.team === currentUser.team && u.id !== currentUser.id).length;

    return { received, sent, valuesCount, teammates };
  };

  const getMetricsStats = (allUsers: User[], allRecognitions: Recognition[]) => {
    const totalUsers = allUsers.length;
    const activeUsers = new Set([
      ...allRecognitions.map((r: Recognition) => r.sender_id),
      ...allRecognitions.map((r: Recognition) => r.recipient_id),
    ]).size;
    const participationRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : null;

    const growthRate = 23;

    const totalRecognitions = allRecognitions.length;

    return { participationRate, growthRate, totalRecognitions };
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("handleLogout: Error al cerrar sesión:", error);
    }
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();

    const upcoming = users
      .filter((user) => user.birthday)
      .map((user) => {
        const [year, month, day] = user.birthday!.split("-").map(Number);
        const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
        const comparisonToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (birthdayThisYear < comparisonToday) {
          birthdayThisYear.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((birthdayThisYear.getTime() - comparisonToday.getTime()) / (1000 * 60 * 60 * 24));

        return { ...user, daysUntil, birthdayDateObject: birthdayThisYear };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return upcoming;
  };

  const openSection = (section: string) => {
    setActiveSection(section);
  };

  const closeSection = () => {
    setActiveSection(null);
    setSelectedUser(null);
  };

  const handleViewUserAchievements = (user: User) => {
    setSelectedUser(user);
    setActiveSection("user-achievements");
  };

  if (loading || !stats || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const { userStats, metricsStats } = stats;
  const upcomingBirthdays = getUpcomingBirthdays();

  if (activeSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
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
            <MetricsSection
              medals={recognitions}
              users={users}
              currentUser={currentUser!}
              onFilterChange={(filterData) => {
                const filteredRecognitions = filterData.filteredRecognitions;
                const filteredUsers = filterData.filteredUsers;
                const calculatedMetricsStats = getMetricsStats(filteredUsers, filteredRecognitions);
                setStats((prev) => (prev ? { ...prev, metricsStats: calculatedMetricsStats } : null));
              }}
            />
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold mb-2">{stats.userStats.received}</div>
              <div className="text-orange-100 font-medium">Reconocimientos Recibidos</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold mb-2">{stats.userStats.sent}</div>
              <div className="text-green-100 font-medium">Reconocimientos Dados</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold mb-2">{stats.userStats.valuesCount}</div>
              <div className="text-amber-100 font-medium">Valores Reconocidos</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-extrabold mb-2">{stats.userStats.teammates}</div>
              <div className="text-red-100 font-medium">Compañeros de Equipo</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 auto-rows-min">
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
                      {upcomingBirthdays[0].birthdayDateObject && (
                        <div className="text-[10px] text-gray-600">
                          {(() => {
                            const birthdayDate = upcomingBirthdays[0].birthdayDateObject;
                            const day = birthdayDate.getDate();
                            const monthNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
                            const month = monthNames[birthdayDate.getMonth()];
                            return `${day} de ${month}`;
                          })()}
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
                {recognitions.filter((r: Recognition) => r.recipient_id === currentUser?.id).length} reconocimientos recibidos
              </div>
            </div>
          </div>
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
          {currentUser?.is_admin && stats?.metricsStats && (
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
                    <div className="text-base font-extrabold text-orange-600 mb-1">
                      {stats.metricsStats.participationRate !== null && stats.metricsStats.participationRate > 0
                        ? `${stats.metricsStats.participationRate}%`
                        : "-"}
                    </div>
                    <div className="text-[8px] text-gray-600 uppercase tracking-wider">Participación</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-extrabold text-orange-600 mb-1">
                      {stats.metricsStats.growthRate !== null && stats.metricsStats.growthRate > 0
                        ? `+${stats.metricsStats.growthRate}%`
                        : "-"}
                    </div>
                    <div className="text-[8px] text-gray-600 uppercase tracking-wider">vs Mes Anterior</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-extrabold text-orange-600 mb-1">
                      {stats.metricsStats.totalRecognitions !== null && stats.metricsStats.totalRecognitions > 0
                        ? stats.metricsStats.totalRecognitions
                        : "-"}
                    </div>
                    <div className="text-[8px] text-gray-600 uppercase tracking-wider">Total</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showRecognitionModal && (
        <RecognitionModal
          users={users}
          values={values}
          currentUser={currentUser}
          onClose={() => {
            setShowRecognitionModal(false);
          }}
          onSuccess={() => {
            setShowRecognitionModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}