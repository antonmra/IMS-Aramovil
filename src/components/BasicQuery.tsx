"use client"

import type React from "react"
import { useState } from "react"
import { db } from "../firebaseConfig"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Search } from "lucide-react"

const BasicQuery: React.FC = () => {
  const [vin, setVin] = useState("")
  const [vehicle, setVehicle] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setVehicle(null)
    setLoading(true)
    try {
      // Consulta en la colección "vehiculos"
      const q = query(collection(db, "vehiculos"), where("vin", "==", vin))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        setError("No se encontró ningún vehículo con ese VIN.")
      } else {
        setVehicle(querySnapshot.docs[0].data())
      }
    } catch (err: any) {
      setError("Error al buscar: " + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-auto bg-white">
      {/* Fondo con imagen */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
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

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen p-4 pt-20 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2EB05A] mb-8 text-center">Consulta Básica del Vehículo</h2>

        <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
          <label className="block text-[#333333] text-sm font-medium mb-2">Ingrese VIN:</label>
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
              {loading ? (
                "Buscando..."
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {vehicle && (
          <div className="mt-4 bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl border border-gray-100">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-[#2EB05A]">Resultado de la Consulta</h3>
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
                <strong className="text-[#2EB05A]">Comentarios:</strong> {vehicle.comments}
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">Fabricante:</strong> {vehicle.maker}
              </div>
              {vehicle.model && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <strong className="text-[#2EB05A]">Modelo:</strong> {vehicle.model}
                </div>
              )}
              {vehicle.number_plate && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <strong className="text-[#2EB05A]">Matrícula:</strong> {vehicle.number_plate}
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-md">
                <strong className="text-[#2EB05A]">Fecha de Registro:</strong>{" "}
                {vehicle.timestamp_end ? new Date(vehicle.timestamp_end.seconds * 1000).toLocaleString() : "N/A"}
              </div>
              <div className="bg-gray-50 p-3 rounded-md col-span-1 sm:col-span-2">
                <strong className="text-[#2EB05A]">Foto del Coche:</strong>{" "}
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BasicQuery

