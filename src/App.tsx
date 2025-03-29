// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import MainMenu from "./components/MainMenu";
import VehicleRegistrationForm from "./components/VehicleRegistrationForm";
import SearchEditVehicle from "./components/SearchEditVehicle";

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* La pantalla principal es el menú */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainMenu />
              </ProtectedRoute>
            }
          />
          {/* Ruta para registrar vehículos */}
          <Route
            path="/registro"
            element={
              <ProtectedRoute>
                <VehicleRegistrationForm />
              </ProtectedRoute>
            }
          />
          {/* Ruta para buscar y editar vehículos */}
          <Route
            path="/edit-vehicle"
            element={
              <ProtectedRoute>
                <SearchEditVehicle />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
