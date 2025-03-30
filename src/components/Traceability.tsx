// Traceability.tsx
"use client"

import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

const Traceability: React.FC = () => {
  const [vin, setVin] = useState("");
  const [vehicle, setVehicle] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVehicle(null);
    setEvents([]);
    setLoading(true);
    try {
      // Consulta: estado actual del vehículo en la colección "vehiculos"
      const qVehicle = query(
        collection(db, "vehiculos"),
        where("vin", "==", vin)
      );
      const vehicleSnapshot = await getDocs(qVehicle);
      if (vehicleSnapshot.empty) {
        setError("No se encontró vehículo con ese VIN.");
      } else {
        setVehicle(vehicleSnapshot.docs[0].data());
      }
      // Consulta: historial de eventos en "EventosDelVehiculo"
      const eventsCollection = collection(db, "EventosDelVehiculo");
      const qEvents = query(
        eventsCollection,
        where("vehicleVin", "==", vin),
        orderBy("updatedAt", "asc")
      );
      const eventsSnapshot = await getDocs(qEvents);
      const eventsList = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsList);
    } catch (err: any) {
      setError("Error en la consulta: " + err.message);
    }
    setLoading(false);
  };

  // Aplanar los cambios: cada cambio del array se transforma en una fila individual
  const flattenedChanges = events.flatMap((event) => {
    if (Array.isArray(event.changes)) {
      return event.changes.map((change: any) => ({
        id: event.id,
        campoModificado: change.field,
        valorAntiguo: change.oldValue,
        cambioRealizado: change.newValue,
        actualizadoPor: event.updatedBy,
        fecha: event.updatedAt
          ? new Date(event.updatedAt.seconds * 1000).toLocaleString()
          : "",
      }));
    }
    return [];
  });

  // Función para convertir los datos a CSV
  const convertToCSV = (data: any[]) => {
    const header = ["Campo Modificado", "Cambio Realizado", "Valor Antiguo", "Fecha", "Actualizado por", "ID"];
    const rows = data.map((row) =>
      [
        row.campoModificado,
        row.cambioRealizado,
        row.valorAntiguo,
        row.fecha,
        row.actualizadoPor,
        row.id,
      ].map((v) => `"${v ?? ""}"`).join(",")
    );
    return [header.join(","), ...rows].join("\n");
  };

  // Copia el CSV al portapapeles
  const copyCSV = () => {
    const csv = convertToCSV(flattenedChanges);
    navigator.clipboard.writeText(csv).then(
      () => alert("Datos copiados al portapapeles"),
      () => alert("Error al copiar datos")
    );
  };

  // Descarga el CSV como archivo
  const downloadCSV = () => {
    const csv = convertToCSV(flattenedChanges);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_trazabilidad_${vin}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función auxiliar para renderizar el valor de "cambioRealizado"
  const renderCambioRealizado = (value: any) => {
    // Si es una URL, mostrar como hipervínculo con texto "Ver enlace"
    if (typeof value === "string" && /^https?:\/\//.test(value)) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          Ver enlace
        </a>
      );
    }
    return value;
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-auto bg-white">
      {/* Fondo con imagen */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{
          backgroundImage: "url('/Menu-background.png')",
          backgroundSize: "cover",
        }}
      ></div>

      {/* Botón para volver */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => navigate(-1)}
          className="bg-[#2EB05A] text-white px-3 py-2 rounded-md hover:bg-[#259048] transition-colors text-sm font-medium shadow-md flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen p-4 pt-20 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2EB05A] mb-8 text-center">
          Trazabilidad del Vehículo
        </h2>

        <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
          <label className="block text-[#333333] text-sm font-medium mb-2">
            Ingrese VIN:
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="flex-1 border border-gray-300 p-3 rounded-md sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-[#2EB05A] focus:border-transparent text-[#333333] bg-white"
              placeholder="Ej: 1HGCM82633A123456"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2EB05A] text-white px-4 py-3 rounded-md sm:rounded-l-none hover:bg-[#259048] transition-colors flex items-center justify-center"
            >
              {loading ? "Buscando..." : <>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </>}
            </button>
          </div>
        </form>

        {error && (
          <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {vehicle && (
          <div className="w-full max-w-3xl bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-100">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-[#2EB05A]">
              Estado Actual
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#333333]">
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">VIN:</strong> {vehicle.vin}
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">Ubicación:</strong> {vehicle.location}
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">Disponibilidad:</strong> {vehicle.disponibilidad}
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">Matrícula:</strong>{" "}
                {vehicle.number_plate ? vehicle.number_plate : "N/A"}
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">Fabricante:</strong> {vehicle.maker}
              </div>
              {vehicle.model && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <strong className="text-[#2EB05A]">Modelo:</strong> {vehicle.model}
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">Fecha Finalización:</strong>{" "}
                {vehicle.timestamp_end ? new Date(vehicle.timestamp_end.seconds * 1000).toLocaleString() : "N/A"}
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">Foto:</strong>{" "}
                {vehicle.car_picture ? (
                  <a
                    href={vehicle.car_picture}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2EB05A] underline ml-2"
                  >
                    Ver foto
                  </a>
                ) : (
                  <span className="ml-2">Sin foto</span>
                )}
              </div>
              <div className="bg-gray-50 p-3 rounded-md sm:col-span-2">
                <strong className="text-[#2EB05A]">Comentarios:</strong> {vehicle.comments || "N/A"}
              </div>
            </div>
          </div>
        )}

        {flattenedChanges.length > 0 && (
          <div className="w-full max-w-6xl bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
            <div className="flex justify-end mb-4 gap-2">
              <button
                onClick={copyCSV}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Copiar a portapapeles
              </button>
              <button
                onClick={downloadCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Descargar CSV
              </button>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-[#2EB05A]">
              Historial de Eventos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border border-gray-200 text-[#333333]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 border border-gray-200 text-[#2EB05A]">Campo Modificado</th>
                    <th className="p-2 border border-gray-200 text-[#2EB05A]">Cambio Realizado</th>
                    <th className="p-2 border border-gray-200 text-[#2EB05A]">Valor Antiguo</th>
                    <th className="p-2 border border-gray-200 text-[#2EB05A]">Fecha</th>
                    <th className="p-2 border border-gray-200 text-[#2EB05A]">Actualizado por</th>
                    <th className="p-2 border border-gray-200 text-[#2EB05A]">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {flattenedChanges.map((row, index) => (
                    <tr key={index} className="text-sm hover:bg-gray-50">
                      <td className="p-2 border border-gray-200 font-bold">{row.campoModificado}</td>
                      <td className="p-2 border border-gray-200 font-bold">
                        {renderCambioRealizado(row.cambioRealizado)}
                      </td>
                      <td className="p-2 border border-gray-200">{row.valorAntiguo ?? "N/A"}</td>
                      <td className="p-2 border border-gray-200">{row.fecha}</td>
                      <td className="p-2 border border-gray-200">{row.actualizadoPor}</td>
                      <td className="p-2 border border-gray-200">{row.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Traceability;
