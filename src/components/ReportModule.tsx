// ReportModule.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

const ReportModule: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 w-full h-full overflow-auto">
      {/* Fondo similar a MainMenu */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('public/Menu-background.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <div className="absolute inset-0 bg-white bg-opacity-10"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen p-4 pt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Módulo de Informes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Botón: Consulta Básica */}
          <button
            onClick={() => navigate("/report/basic")}
            className="flex flex-col items-center p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-green-500 text-left"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">Consulta Básica</h3>
            <p className="text-gray-500">Estado actual por VIN</p>
          </button>

          {/* Botón: Trazabilidad */}
          <button
            onClick={() => navigate("/report/traceability")}
            className="flex flex-col items-center p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-500 text-left"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">Trazabilidad</h3>
            <p className="text-gray-500">Historial de eventos</p>
          </button>

          {/* Botón: Reporte Detallado */}
          <button
            onClick={() => alert("Funcionalidad en desarrollo")}
            className="flex flex-col items-center p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-purple-500 text-left"
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">Reporte Detallado</h3>
            <p className="text-gray-500">Últimas 24h de eventos</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModule;
