"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, FileDown, RefreshCw } from "lucide-react"

const AdvancedReport: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const response = await fetch("https://us-central1-ims-aramovil-dev.cloudfunctions.net/reporteOnDemand")
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Error al generar el reporte")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "reporte_24h.csv"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

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

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2EB05A] mb-8 text-center">Reporte Avanzado</h2>

          <p className="text-[#333333] mb-6 text-center">
            Genere un reporte completo de las últimas 24 horas con todos los movimientos y cambios de estado de los
            vehículos.
          </p>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="bg-[#2EB05A] text-white px-6 py-3 rounded-md hover:bg-[#259048] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full md:w-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generando reporte...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5 mr-2" />
                  Generar Reporte 24h
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p className="font-medium mb-2">Error:</p>
              <p className="mb-3">{error}</p>
              <button
                onClick={handleDownload}
                className="text-[#2EB05A] hover:text-[#259048] font-medium flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reintentar
              </button>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
              <p>El reporte se ha generado y descargado correctamente.</p>
            </div>
          )}

          <div className="mt-8 text-sm text-gray-500">
            <p className="text-center">
              Este reporte incluye todos los vehículos en el sistema y sus movimientos durante las últimas 24 horas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedReport

