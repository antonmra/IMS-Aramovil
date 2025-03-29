// src/components/MainMenu.tsx
"use client"

import type React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { ClipboardList, Edit, FileText } from "lucide-react";

const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-auto">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('public/Menu-background.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      {/* Sign out button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-xs font-medium shadow-md"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-3xl w-full mx-auto">
          <div className="h-2 bg-green-600 w-full"></div>
          <div className="p-6">
            {/* Logo and Title */}
            <div className="flex flex-col items-center mb-8">
              <img src="/logo grupo Aramovil b-g.png" alt="Aramovil Logo" className="h-16 mb-4" />
              <h2 className="text-2xl font-bold text-center text-gray-800">Sistema de Gestión de Inventario</h2>
              <p className="text-gray-600 mt-2 text-center">Seleccione una opción para continuar</p>
            </div>

            {/* Menu Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* Register Vehicle */}
              <button
                onClick={() => navigate("/registro")}
                className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-green-500 group"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <ClipboardList className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Registrar Vehículo</h3>
                <p className="text-sm text-gray-500 text-center">Añadir un nuevo vehículo al inventario</p>
              </button>

              {/* Search & Edit */}
              <button
                onClick={() => navigate("/edit-vehicle")}
                className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-500 group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Edit className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Buscar y Editar</h3>
                <p className="text-sm text-gray-500 text-center">Modificar información de vehículos existentes</p>
              </button>

              {/* Reports */}
              <button
                onClick={() => alert("Funcionalidad en desarrollo")}
                className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-purple-500 group"
              >
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Informes</h3>
                <p className="text-sm text-gray-500 text-center">Generar reportes sobre vehículos específicos</p>
              </button>
            </div>

            <div className="mt-10 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} Grupo Aramovil. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
