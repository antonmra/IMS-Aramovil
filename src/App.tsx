// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import MainMenu from "./components/MainMenu";
import VehicleRegistrationForm from "./components/VehicleRegistrationForm";
import SearchEditVehicle from "./components/SearchEditVehicle";
import ReportModule from "./components/ReportModule";
import BasicQuery from "./components/BasicQuery";
import Traceability from "./components/Traceability";

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Pantalla principal: Menú */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainMenu />
              </ProtectedRoute>
            }
          />
          {/* Registro de Vehículos */}
          <Route
            path="/registro"
            element={
              <ProtectedRoute>
                <VehicleRegistrationForm />
              </ProtectedRoute>
            }
          />
          {/* Búsqueda y Edición de Vehículos */}
          <Route
            path="/edit-vehicle"
            element={
              <ProtectedRoute>
                <SearchEditVehicle />
              </ProtectedRoute>
            }
          />
          {/* Módulo de Informes */}
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportModule />
              </ProtectedRoute>
            }
          />
          {/* Consulta Básica (parte de ReportModule) */}
          <Route
            path="/report/basic"
            element={
              <ProtectedRoute>
                <BasicQuery />
              </ProtectedRoute>
            }
            />
            {/* Consulta Básica (parte de ReportModule) */}
            <Route
              path="/report/traceability"
              element={
                <ProtectedRoute>
                  <Traceability />
                </ProtectedRoute>
              }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
