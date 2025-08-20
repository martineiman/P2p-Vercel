"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ForceGraph2D from "react-force-graph-2d"; // Cambiar a importación por defecto
import { Recognition, User } from "@/lib/database";

interface MetricsSectionProps {
  medals: Recognition[];
  users: User[];
  currentUser: User | null;
  onFilterChange?: (filterData: { filteredRecognitions: Recognition[]; filteredUsers: User[] }) => void;
}

export default function MetricsSection({ medals, users, currentUser, onFilterChange }: MetricsSectionProps) {
  const [filterType, setFilterType] = useState<"empleado" | "equipo" | "área" | "departamento" | "sucursal">("empleado");
  const [filterValue, setFilterValue] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const fgRef = useRef<any>();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filterOptions = useMemo(() => {
    switch (filterType) {
      case "empleado":
        return users.map((u) => u.name);
      case "equipo":
        return [...new Set(users.map((u) => u.team).filter(Boolean))];
      case "área":
        return [...new Set(users.map((u) => u.area).filter(Boolean))];
      case "departamento":
        return [...new Set(users.map((u) => u.department).filter(Boolean))];
      case "sucursal":
        return [...new Set(users.map((u) => u.branch).filter(Boolean))];
      default:
        return [];
    }
  }, [filterType, users]);

  const filteredRecognitions = useMemo(() => {
    return medals.filter((r) => {
      if ((dateFrom && new Date(r.created_at) < new Date(dateFrom)) || (dateTo && new Date(r.created_at) > new Date(dateTo))) {
        return false;
      }

      const sender = users.find((u) => u.id === r.sender_id);
      const recipient = users.find((u) => u.id === r.recipient_id);

      if (!sender || !recipient) return false;

      switch (filterType) {
        case "empleado":
          return sender.name === filterValue || recipient.name === filterValue;
        case "equipo":
          return sender.team === filterValue || recipient.team === filterValue;
        case "área":
          return sender.area === filterValue || recipient.area === filterValue;
        case "departamento":
          return sender.department === filterValue || recipient.department === filterValue;
        case "sucursal":
          return sender.branch === filterValue || recipient.branch === filterValue;
        default:
          return false;
      }
    });
  }, [medals, users, filterType, filterValue, dateFrom, dateTo]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      switch (filterType) {
        case "empleado":
          return filterValue ? u.name === filterValue : true;
        case "equipo":
          return filterValue ? u.team === filterValue : true;
        case "área":
          return filterValue ? u.area === filterValue : true;
        case "departamento":
          return filterValue ? u.department === filterValue : true;
        case "sucursal":
          return filterValue ? u.branch === filterValue : true;
        default:
          return true;
      }
    });
  }, [users, filterType, filterValue]);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({ filteredRecognitions, filteredUsers });
    }
  }, [filteredRecognitions, filteredUsers, onFilterChange]);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];

    filteredRecognitions.forEach((rec) => {
      const sender = users.find((u) => u.id === rec.sender_id);
      const recipient = users.find((u) => u.id === rec.recipient_id);
      if (!sender || !recipient) return;

      const senderNode = {
        id: sender.name,
        label: sender.name,
        color: sender.name === filterValue ? "orange" : "gray",
      };

      const recipientNode = {
        id: recipient.name,
        label: recipient.name,
        color: recipient.name === filterValue ? "orange" : "gray",
      };

      if (!nodes.find((n) => n.id === senderNode.id)) nodes.push(senderNode);
      if (!nodes.find((n) => n.id === recipientNode.id)) nodes.push(recipientNode);

      links.push({ source: sender.name, target: recipient.name });
    });

    return { nodes, links };
  }, [filteredRecognitions, users, filterValue]);

  const interactionStats = useMemo(() => {
    const stats: Record<string, { sent: number; received: number }> = {};
    filteredRecognitions.forEach((rec) => {
      const sender = users.find((u) => u.id === rec.sender_id);
      const recipient = users.find((u) => u.id === rec.recipient_id);
      if (!sender || !recipient) return;

      const keySender = filterType === "empleado" ? recipient.name : recipient[filterType];
      const keyRecipient = filterType === "empleado" ? sender.name : sender[filterType];

      if (filterType === "empleado" && sender.name === filterValue) {
        stats[keySender] = stats[keySender] || { sent: 0, received: 0 };
        stats[keySender].sent++;
      }
      if (filterType === "empleado" && recipient.name === filterValue) {
        stats[keyRecipient] = stats[keyRecipient] || { sent: 0, received: 0 };
        stats[keyRecipient].received++;
      }
    });
    return stats;
  }, [filteredRecognitions, users, filterType, filterValue]);

  return (
    <div>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-2 items-center">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any);
              setFilterValue("");
            }}
            className="border p-1 rounded"
          >
            <option value="empleado">Empleado</option>
            <option value="equipo">Equipo</option>
            <option value="área">Área</option>
            <option value="departamento">Departamento</option>
            <option value="sucursal">Sucursal</option>
          </select>

          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="">Todos</option>
            {filterOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border p-1 rounded"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border p-1 rounded"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent style={{ height: "550px" }}>
          {isClient && ForceGraph2D ? (
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeLabel={(node: any) => node.label}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.label;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.fillStyle = node.color;
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = "#000";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, node.x!, node.y! - 12);
              }}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
            />
          ) : (
            <div>Cargando gráfico...</div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent>
          <h2 className="font-semibold mb-2">Estadísticas Detalladas</h2>
          <ul>
            {Object.entries(interactionStats).map(([key, value]) => (
              <li key={key}>{key}: Enviados: {value.sent} / Recibidos: {value.received}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}