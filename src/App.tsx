// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import VehicleRegistrationForm from "./components/VehicleRegistrationForm";
import SearchEditVehicle from "./components/SearchEditVehicle";

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <VehicleRegistrationForm />
              </ProtectedRoute>
            }
          />
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
