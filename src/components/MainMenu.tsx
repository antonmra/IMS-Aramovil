// src/components/MainMenu.tsx
"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../firebaseConfig"
import { useAuthState } from "react-firebase-hooks/auth"
import { ClipboardList, Edit, FileText } from "lucide-react"

const MainMenu: React.FC = () => {
  const navigate = useNavigate()
  const [user] = useAuthState(auth)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error)
    }
  }

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
          backgroundColor: "#ffffff",
        }}
      >
        {/* Se reduce la opacidad para mayor transparencia */}
        <div className="absolute inset-0 bg-white bg-opacity-10"></div>
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

      {/* Main content area: se usa justify-start con pt-20 para subir los elementos */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen p-4 pt-20">
        {/* Welcome message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-700">
            Bienvenido {user?.displayName || user?.email || "[Usuario]"},
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">¿Qué quieres hacer?</h2>
        </div>

        {/* Menu Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Register Vehicle */}
          <button
            onClick={() => navigate("/registro")}
            className="flex flex-col items-center p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-green-500 text-left"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">Registrar Vehículo</h3>
            <p className="text-gray-500">Añadir un nuevo vehículo al inventario</p>
          </button>

          {/* Search & Edit */}
          <button
            onClick={() => navigate("/edit-vehicle")}
            className="flex flex-col items-center p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-500 text-left"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Edit className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">Buscar y Editar</h3>
            <p className="text-gray-500">Modificar información de vehículos existentes</p>
          </button>

          {/* Reports */}
          <button
            onClick={() => alert("Funcionalidad en desarrollo")}
            className="flex flex-col items-center p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-purple-500 text-left"
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">Informes</h3>
            <p className="text-gray-500">Generar reportes sobre vehículos específicos</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MainMenu;
