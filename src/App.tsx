import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Login from "./components/Login"
import ProtectedRoute from "./components/ProtectedRoute"
import VehicleRegistrationForm from "./components/VehicleRegistrationForm"

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
        </Routes>
      </div>
    </Router>
  )
}

export default App