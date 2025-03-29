"use client"

// src/components/SearchEditVehicle.tsx
import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import {
  collectionGroup,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { signOut } from "firebase/auth";

interface VehicleData {
  operator?: string;
  location?: string;
  vin?: string;
  number_plate?: string;
  maker?: string;
  model?: string;
  car_picture?: string;
  state_verified?: string;
  everything_ok?: string;
  comments?: string;
  disponibilidad?: string;
  timestamp_start?: any; // Firestore timestamp
}

interface ChangeEntry {
  field: string;
  oldValue: any;
  newValue: any;
}

// Función para convertir undefined en null (evita errores al guardar en Firestore)
const safeValue = (val: any) => (val === undefined ? null : val);

const SearchEditVehicle: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  // Estado para la búsqueda
  const [searchVin, setSearchVin] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [vehicleDocRef, setVehicleDocRef] = useState<any>(null);

  // Estado para el último comentario (extraído del historial)
  const [lastComment, setLastComment] = useState("");

  // Estado para los campos editables
  const [formData, setFormData] = useState({
    location: "Nave",
    numberPlate: "",
    disponibilidad: "Para matricular",
    modificationComment: "",
  });

  // Buscar vehículo por VIN
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSearch(true);
    setErrorMsg("");
    setVehicleData(null);
    setVehicleDocRef(null);
    setLastComment("");

    try {
      // Se usa "vehiculos" (en español)
      const q = query(
        collectionGroup(db, "vehiculos"),
        where("vin", "==", searchVin)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setErrorMsg("No se encontró ningún vehículo con ese VIN.");
      } else {
        // Asumimos que el VIN es único
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data() as VehicleData;
        setVehicleData(data);
        setVehicleDocRef(docSnap.ref);
        setFormData({
          location: data.location || "Nave",
          numberPlate: data.number_plate || "",
          disponibilidad: data.disponibilidad || "Para matricular",
          modificationComment: "",
        });
      }
    } catch (err: any) {
      setErrorMsg("Error al buscar: " + err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Obtener el último comentario del historial
  useEffect(() => {
    const fetchLastComment = async () => {
      if (vehicleDocRef) {
        try {
          const historialRef = collection(vehicleDocRef, "historial");
          const qHist = query(historialRef, orderBy("updatedAt", "desc"));
          const histSnapshot = await getDocs(qHist);
          for (const docSnap of histSnapshot.docs) {
            const histData = docSnap.data();
            if (histData.changes && Array.isArray(histData.changes)) {
              const modCommentChange = histData.changes.find(
                (change: any) =>
                  change.field === "modificationComment" &&
                  change.newValue &&
                  change.newValue.trim() !== ""
              );
              if (modCommentChange) {
                setLastComment(modCommentChange.newValue);
                break;
              }
            }
          }
        } catch (error: any) {
          console.error("Error al obtener el último comentario:", error);
        }
      }
    };
    fetchLastComment();
  }, [vehicleDocRef]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleData || !vehicleDocRef) return;

    const changes: ChangeEntry[] = [];

    // Comparar la ubicación
    if (formData.location !== safeValue(vehicleData.location)) {
      changes.push({
        field: "location",
        oldValue: safeValue(vehicleData.location),
        newValue: safeValue(formData.location),
      });
    }
    // Comparar la matrícula (solo se permite editar si estaba vacía)
    const currentPlate = (vehicleData.number_plate || "").trim();
    if (currentPlate === "" && formData.numberPlate.trim() !== "") {
      changes.push({
        field: "number_plate",
        oldValue: safeValue(vehicleData.number_plate),
        newValue: safeValue(formData.numberPlate.trim()),
      });
    }
    // Comparar la disponibilidad de uso
    if (formData.disponibilidad !== safeValue(vehicleData.disponibilidad)) {
      changes.push({
        field: "disponibilidad",
        oldValue: safeValue(vehicleData.disponibilidad),
        newValue: safeValue(formData.disponibilidad),
      });
    }
    // Nuevo comentario de modificación
    if (formData.modificationComment.trim() !== "") {
      changes.push({
        field: "modificationComment",
        oldValue: "",
        newValue: safeValue(formData.modificationComment.trim()),
      });
    }

    if (changes.length === 0) {
      alert("No se detectaron cambios.");
      return;
    }

    console.log("Changes array:", changes);

    try {
      // Preparar el objeto de actualización
      const updateData: any = {
        location: safeValue(formData.location),
        disponibilidad: safeValue(formData.disponibilidad),
      };
      if (currentPlate === "" && formData.numberPlate.trim() !== "") {
        updateData.number_plate = safeValue(formData.numberPlate.trim());
      }

      await updateDoc(vehicleDocRef, updateData);

      // Agregar el registro en la subcolección "historial"
      const historialCollection = collection(vehicleDocRef, "historial");
      await addDoc(historialCollection, {
        updatedBy: user?.email || "desconocido",
        updatedAt: serverTimestamp(),
        changes: changes,
      });

      alert("Vehículo actualizado correctamente.");
      navigate(-1);
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("Sesión cerrada correctamente");
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
          backgroundImage: "url('public/Logos Agrupados.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      {/* Botón de cerrar sesión */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-xs font-medium shadow-md"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Botón para volver */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition-colors text-xs font-medium shadow-md flex items-center"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Volver
        </button>
      </div>

      {/* Área principal de contenido */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen p-4">
        {/* Sección de búsqueda */}
        <div className="w-full md:w-2/3 p-4 md:p-6 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-3xl mx-auto">
            <div className="h-2 bg-green-600 w-full"></div>
            <div className="p-6">
              {/* Logo y Título */}
              <div className="flex flex-col sm:flex-row items-center mb-6">
                <img src="/logo grupo Aramovil b-g.png" alt="Aramovil Logo" className="h-10 mb-3 sm:mb-0" />
                <h2 className="text-xl font-bold text-gray-800 sm:ml-4">
                  Buscar y Modificar Vehículo
                </h2>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <p className="text-red-700 text-sm">{errorMsg}</p>
                </div>
              )}

              {/* Formulario de búsqueda */}
              <div className="mb-8">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Ingrese VIN del vehículo a buscar*
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={searchVin}
                        onChange={(e) => setSearchVin(e.target.value)}
                        className="flex-1 border border-gray-300 p-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        placeholder="Ej: 1HGCM82633A123456"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loadingSearch}
                        className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors flex items-center"
                      >
                        {loadingSearch ? (
                          "Buscando..."
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-1" />
                            Buscar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Si se encontró el vehículo, mostrar la UI organizada en tres cajas */}
              {vehicleData && vehicleDocRef && (
                <div className="space-y-6">
                  {/* Caja 1: Información Básica */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Información Básica</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">VIN</p>
                        <p className="font-medium text-gray-900">{vehicleData.vin}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Fecha de Registro</p>
                        <p className="font-medium text-gray-900">
                          {vehicleData.timestamp_start &&
                            new Date(vehicleData.timestamp_start.seconds * 1000).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Matrícula</p>
                        { (vehicleData.number_plate || "").trim() !== "" ? (
                          <p className="font-medium text-gray-900">{vehicleData.number_plate}</p>
                        ) : (
                          <input
                            type="text"
                            name="numberPlate"
                            value={formData.numberPlate}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-2 rounded-md bg-yellow-100 text-gray-900"
                            placeholder="Ingrese matrícula"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Caja 2: Información de Registro */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Datos de Registro</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Operador</p>
                        <p className="font-medium text-gray-900">{vehicleData.operator}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Fabricante</p>
                        <p className="font-medium text-gray-900">{vehicleData.maker}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Modelo</p>
                        <p className="font-medium text-gray-900">{vehicleData.model || "No definido"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Caja 3: Datos Editables y Modificación */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Modificar Datos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Ubicación */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Ubicación</label>
                        <select
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
                        >
                          <option value="Nave">Nave</option>
                          <option value="Taller Toyota-Magia">Taller Toyota-Magia</option>
                          <option value="Taller Stellantis">Taller Stellantis</option>
                          <option value="Expo MG">Expo MG</option>
                          <option value="Expo Mitsubishi">Expo Mitsubishi</option>
                          <option value="Expo Toyota">Expo Toyota</option>
                          <option value="Expo Stellantis">Expo Stellantis</option>
                        </select>
                      </div>
                      {/* Disponibilidad de Uso */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Disponibilidad de Uso</label>
                        <select
                          name="disponibilidad"
                          value={formData.disponibilidad}
                          onChange={handleChange}
                          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
                        >
                          <option value="Demo">Demo</option>
                          <option value="Cortesía">Cortesía</option>
                          <option value="Flota">Flota</option>
                          <option value="VN">VN</option>
                          <option value="VO">VO</option>
                          <option value="Vendido">Vendido</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                    {/* Usuario Actual */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-600">Usuario Actual</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                    {/* Nuevo comentario */}
                    <div className="mt-4">
                      <label className="block text-xs text-gray-600 mb-1">Nuevo Comentario</label>
                      <textarea
                        name="modificationComment"
                        value={formData.modificationComment}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-2 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={3}
                        placeholder="Explique qué y por qué se modificó"
                      ></textarea>
                    </div>
                  </div>

                  {/* Mostrar último comentario (si existe) */}
                  {lastComment && (
                    <div className="bg-blue-50 p-4 rounded-lg shadow mt-4">
                      <h3 className="text-sm font-bold text-blue-800 mb-1">Último Comentario</h3>
                      <p className="text-sm text-blue-700">{lastComment}</p>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="sm:w-1/3 bg-gray-500 text-white py-3 rounded-md hover:bg-gray-600 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="submit"
                      className="sm:w-2/3 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      GUARDAR CAMBIOS
                    </button>
                  </div>
                </div>
              )}

              {!vehicleData && !loadingSearch && (
                <div className="text-center py-8">
                  <div className="bg-gray-50 p-8 rounded-lg">
                    <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Busque un vehículo por su VIN
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Ingrese el número VIN completo para buscar y modificar la información del vehículo.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                © {new Date().getFullYear()} Grupo Aramovil. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </div>

        {/* Sección decorativa lateral */}
        <div className="hidden md:block md:w-1/3 relative">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Grupo Aramovil</h3>
              <p className="text-gray-600 mb-4">
                Sistema de gestión de inventario para el registro y seguimiento de vehículos en nuestras instalaciones.
              </p>
              <div className="flex justify-center">
                <img
                  src="/logo grupo Aramovil b-g.png"
                  alt="Aramovil Logo"
                  className="h-16"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchEditVehicle;
