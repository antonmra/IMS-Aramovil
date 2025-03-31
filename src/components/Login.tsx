"use client"

import type React from "react"
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebaseConfig"

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/")
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.")
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Por favor, intenta más tarde.")
      } else {
        setError("Error al iniciar sesión. Por favor, intenta de nuevo.")
      }
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Instalaciones Huesca Retro.png')" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md mx-4">
        <div className="h-2 bg-green-600 w-full"></div>

        <div className="p-8">
          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <img src="/logo grupo Aramovil b-g.png" alt="Aramovil Logo" className="w-40 h-auto" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Sistema de Gestión de Inventario</h2>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Correo Electrónico</label>
              <input
                type="email"
                className="border border-gray-300 p-3 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@aramovil.es"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Contraseña</label>
              <input
                type="password"
                className="border border-gray-300 p-3 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              INICIAR SESIÓN
            </button>
          </form>

          {/* Footer Links */}
          <p className="text-center text-sm text-gray-600 mt-6">
            ¿Olvidaste tu contraseña?{" "}
            <a href="#" className="text-green-600 hover:underline font-medium">
              Recuperarla aquí
            </a>
          </p>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Grupo Aramovil. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

