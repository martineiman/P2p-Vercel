import { Card } from "@/components/ui/card"
import type { Value } from "@/lib/database" // Añade esta línea

const corporateValues = [
  {
    name: "Colaboración",
    icon: "🤝",
    color: "#3B82F6",
    description: "Trabajar en equipo para lograr objetivos comunes",
    example:
      "Ayudar a un compañero con un proyecto complejo, compartir conocimientos o facilitar la comunicación entre equipos.",
  },
  {
    name: "Innovación",
    icon: "💡",
    color: "#F59E0B",
    description: "Buscar nuevas formas de hacer las cosas",
    example:
      "Proponer una solución creativa a un problema, implementar una nueva tecnología o mejorar un proceso existente.",
  },
  {
    name: "Excelencia",
    icon: "⭐",
    color: "#EF4444",
    description: "Buscar la calidad en todo lo que hacemos",
    example: "Entregar trabajo de alta calidad, superar expectativas o mantener estándares elevados consistentemente.",
  },
  {
    name: "Integridad",
    icon: "🛡️",
    color: "#10B981",
    description: "Actuar con honestidad y transparencia",
    example: "Ser honesto sobre errores, cumplir compromisos o actuar éticamente en situaciones difíciles.",
  },
  {
    name: "Liderazgo",
    icon: "👑",
    color: "#8B5CF6",
    description: "Inspirar y guiar a otros hacia el éxito",
    example: "Motivar al equipo durante un proyecto desafiante, tomar iniciativa o mentorear a compañeros junior.",
  },
  {
    name: "Adaptabilidad",
    icon: "🔄",
    color: "#06B6D4",
    description: "Flexibilidad ante los cambios",
    example:
      "Adaptarse rápidamente a nuevos requerimientos, aprender nuevas tecnologías o manejar cambios de prioridades.",
  },
]

interface ValuesSectionProps {
  values: Value[];
}


export function ValuesSection({ values }: ValuesSectionProps) {

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">💎</span>
          <h1 className="text-2xl font-bold text-gray-900">Nuestros Valores Corporativos</h1>
        </div>
        <p className="text-gray-600">Conoce nuestros valores y cómo aplicarlos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {corporateValues.map((value, index) => (
          <Card key={value.name} className="p-6 animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{value.icon}</span>
              <h3 className="text-xl font-bold" style={{ color: value.color }}>
                {value.name}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{value.description}</p>

            <div className="p-4 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: value.color }}>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Ejemplo de aplicación:</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{value.example}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
