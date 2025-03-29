// src/components/SearchEditVehicle.tsx
import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import {
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface VehicleData {
  operator: string;
  location: string;
  vin: string;
  number_plate: string;
  maker: string;
  model: string;
  car_picture: string;
  state_verified: string;
  everything_ok: string;
  comments: string;
  timestamp_start: any; // Firestore timestamp
}

interface ChangeEntry {
  field: string;
  oldValue: any;
  newValue: any;
}

const SearchEditVehicle: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  // Estado para la búsqueda
  const [searchVin, setSearchVin] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [vehicleDocRef, setVehicleDocRef] = useState<any>(null);

  // Estado para los campos editables
  const [formData, setFormData] = useState({
    location: "Nave",
    numberPlate: "",
    modificationComment: "",
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSearch(true);
    setErrorMsg("");
    setVehicleData(null);
    setVehicleDocRef(null);

    try {
      // Se hace un query a todas las subcolecciones "vehiculos" buscando el VIN
      const q = query(
        collectionGroup(db, "vehicles"),
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
          modificationComment: "",
        });
      }
    } catch (err: any) {
      setErrorMsg("Error al buscar: " + err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleData || !vehicleDocRef) return;

    const changes: ChangeEntry[] = [];

    // Ubicación: siempre se permite modificar
    if (formData.location !== vehicleData.location) {
      changes.push({
        field: "location",
        oldValue: vehicleData.location,
        newValue: formData.location,
      });
    }
    // Matrícula: solo se permite si estaba vacía
    if (
      vehicleData.number_plate.trim() === "" &&
      formData.numberPlate.trim() !== ""
    ) {
      changes.push({
        field: "number_plate",
        oldValue: vehicleData.number_plate,
        newValue: formData.numberPlate,
      });
    }
    // Nuevo comentario: se registra como información adicional
    if (formData.modificationComment.trim() !== "") {
      changes.push({
        field: "modificationComment",
        oldValue: "",
        newValue: formData.modificationComment,
      });
    }

    if (changes.length === 0) {
      alert("No se detectaron cambios.");
      return;
    }

    try {
      // Actualizar el documento del vehículo
      const updateData: any = {
        location: formData.location,
      };
      if (
        vehicleData.number_plate.trim() === "" &&
        formData.numberPlate.trim() !== ""
      ) {
        updateData.number_plate = formData.numberPlate;
      }
      await updateDoc(vehicleDocRef, updateData);

      // Agregar registro en la subcolección "historial"
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

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Buscar y Modificar Vehículo</h2>
      {/* Sección de búsqueda por VIN */}
      <form onSubmit={handleSearch} className="mb-6 space-y-4">
        <div>
          <label className="block text-gray-700">Ingrese VIN:</label>
          <input
            type="text"
            value={searchVin}
            onChange={(e) => setSearchVin(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
            required
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
          Buscar
        </button>
      </form>
      {loadingSearch && <p>Cargando...</p>}
      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      {/* Si se encontró el vehículo, mostrar el formulario de edición */}
      {vehicleData && vehicleDocRef && (
        <div>
          <h3 className="text-xl font-bold mb-4">
            Editar Vehículo (VIN: {vehicleData.vin})
          </h3>
          <p className="mb-2">
            Fecha de registro:{" "}
            {new Date(vehicleData.timestamp_start.seconds * 1000).toLocaleString()}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operador (readOnly) */}
            <div>
              <label className="block text-gray-700">Operador</label>
              <input
                type="text"
                value={vehicleData.operator}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
              />
            </div>
            {/* Ubicación (editable) */}
            <div>
              <label className="block text-gray-700">Ubicación</label>
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
            {/* VIN (readOnly) */}
            <div>
              <label className="block text-gray-700">VIN</label>
              <input
                type="text"
                value={vehicleData.vin}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
              />
            </div>
            {/* Matrícula (editable solo si estaba vacía) */}
            <div>
              <label className="block text-gray-700">Matrícula</label>
              <input
                type="text"
                name="numberPlate"
                value={formData.numberPlate}
                onChange={handleChange}
                readOnly={vehicleData.number_plate.trim() !== ""}
                className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
                placeholder="Ingrese matrícula si no está registrada"
              />
            </div>
            {/* Fabricante (readOnly) */}
            <div>
              <label className="block text-gray-700">Fabricante</label>
              <input
                type="text"
                value={vehicleData.maker}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
              />
            </div>
            {/* Modelo (readOnly) */}
            <div>
              <label className="block text-gray-700">Modelo</label>
              <input
                type="text"
                value={vehicleData.model}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
              />
            </div>
            {/* Comentarios anteriores (readOnly) */}
            <div>
              <label className="block text-gray-700">Comentarios anteriores</label>
              <textarea
                value={vehicleData.comments}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
                rows={3}
              ></textarea>
            </div>
            {/* Nuevo comentario para la modificación */}
            <div>
              <label className="block text-gray-700">Nuevo comentario</label>
              <textarea
                name="modificationComment"
                value={formData.modificationComment}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
                rows={3}
                placeholder="Explique qué y por qué se modificó (opcional)"
              ></textarea>
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md text-gray-900">
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SearchEditVehicle;
