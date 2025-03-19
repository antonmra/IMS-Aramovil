// src/components/VehicleRegistrationForm.tsx
import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, storage, auth } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";

const VehicleRegistrationForm: React.FC = () => {
  // Form states
  const [operator, setOperator] = useState("");
  const [vin, setVin] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [maker, setMaker] = useState("");
  const [model, setModel] = useState("");
  const [carPictureFile, setCarPictureFile] = useState<File | null>(null);
  const [carPictureURL, setCarPictureURL] = useState("");
  const [stateVerified, setStateVerified] = useState("yes");
  const [everythingOk, setEverythingOk] = useState("yes");
  const [evidencesFiles, setEvidencesFiles] = useState<File[]>([]);
  const [evidencesURLs, setEvidencesURLs] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [registrationStarted, setRegistrationStarted] = useState<Date | null>(null);
  const [registrationEnded, setRegistrationEnded] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Placeholder for extracting VIN from image using Google Cloud Vision API
  const extractVinFromImage = async (file: File): Promise<string> => {
    // Simulate API call delay and return a dummy VIN
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("DUMMYVIN123456789");
      }, 2000);
    });
  };

  // Placeholder for determining maker from VIN
  const determineMakerFromVin = (vin: string): string => {
    return vin.startsWith("1") ? "Toyota" : "Ford";
  };

  // Handle car picture input
  const handleCarPictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCarPictureFile(file);
    }
  };

  // Handle evidence files input
  const handleEvidencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidencesFiles(Array.from(e.target.files));
    }
  };

  // Function to upload a file to Firebase Storage and return its URL
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (!operator) {
        setErrorMsg("Operator selection is mandatory.");
        setIsSubmitting(false);
        return;
      }
      if (!vin) {
        setErrorMsg("VIN is mandatory.");
        setIsSubmitting(false);
        return;
      }
      if (!carPictureFile) {
        setErrorMsg("Car picture is mandatory.");
        setIsSubmitting(false);
        return;
      }

      let finalVin = vin;
      if (!vin && carPictureFile) {
        finalVin = await extractVinFromImage(carPictureFile);
        setVin(finalVin);
      }

      const finalMaker = determineMakerFromVin(finalVin);
      setMaker(finalMaker);

      const carPicPath = `carPictures/${Date.now()}_${carPictureFile.name}`;
      const carPicURL = await uploadFile(carPictureFile, carPicPath);
      setCarPictureURL(carPicURL);

      let evidencesURLsLocal: string[] = [];
      if (everythingOk === "no" && evidencesFiles.length > 0) {
        for (const file of evidencesFiles) {
          const evidencePath = `evidences/${Date.now()}_${file.name}`;
          const url = await uploadFile(file, evidencePath);
          evidencesURLsLocal.push(url);
        }
        setEvidencesURLs(evidencesURLsLocal);
      }

      const startTime = registrationStarted ? registrationStarted : new Date();
      const endTime = new Date();
      setRegistrationEnded(endTime);
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      const vehicleData = {
        operator,
        timestamp_start: startTime,
        vin: finalVin,
        number_plate: numberPlate,
        maker: finalMaker,
        model,
        car_picture: carPicURL,
        state_verified: stateVerified,
        everything_ok: everythingOk,
        evidences: evidencesURLsLocal,
        comments,
        timestamp_end: endTime,
        registry_duration: duration,
      };

      const vehiclesCollection = collection(db, "vehicles");
      await addDoc(vehiclesCollection, vehicleData);

      alert("Vehicle registered successfully!");

      // Reset the form
      setOperator("");
      setVin("");
      setNumberPlate("");
      setMaker("");
      setModel("");
      setCarPictureFile(null);
      setCarPictureURL("");
      setStateVerified("yes");
      setEverythingOk("yes");
      setEvidencesFiles([]);
      setEvidencesURLs([]);
      setComments("");
      setRegistrationStarted(new Date());
      setRegistrationEnded(null);
    } catch (err: any) {
      console.error("Error registering vehicle:", err);
      setErrorMsg("Error registering vehicle: " + err.message);
    }

    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    setRegistrationStarted(new Date());
  }, []);

  return (
    <div className="min-h-screen w-screen flex bg-gray-100">
      {/* Left Column: Registration Form */}
      <div className="w-full lg:w-2/3 p-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSignOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Nuevo Registro de Vehículo</h2>
          {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator Selection */}
            <div>
              <label className="block text-gray-700 mb-1">Operador*</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar Operador</option>
                <option value="Operator A">Operator A</option>
                <option value="Operator B">Operator B</option>
                <option value="Operator C">Operator C</option>
              </select>
            </div>
            {/* VIN Input */}
            <div>
              <label className="block text-gray-700 mb-1">VIN*</label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese VIN manualmente o escanee"
                required
              />
            </div>
            {/* Number Plate */}
            <div>
              <label className="block text-gray-700 mb-1">Matrícula</label>
              <input
                type="text"
                value={numberPlate}
                onChange={(e) => setNumberPlate(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese matrícula (si está disponible)"
              />
            </div>
            {/* Maker (auto-filled) */}
            <div>
              <label className="block text-gray-700 mb-1">Fabricante</label>
              <input
                type="text"
                value={maker}
                readOnly
                className="w-full border border-gray-300 p-2 rounded bg-gray-100"
              />
            </div>
            {/* Model */}
            <div>
              <label className="block text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese el modelo (opcional)"
              />
            </div>
            {/* Car Picture Upload */}
            <div>
              <label className="block text-gray-700 mb-1">Foto del Vehículo*</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCarPictureChange}
                className="w-full"
                required
              />
            </div>
            {/* State Verified */}
            <div>
              <label className="block text-gray-700 mb-1">Estado Verificado?*</label>
              <select
                value={stateVerified}
                onChange={(e) => setStateVerified(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            {/* Everything OK */}
            <div>
              <label className="block text-gray-700 mb-1">¿Todo OK?*</label>
              <select
                value={everythingOk}
                onChange={(e) => setEverythingOk(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            {/* Evidence Upload (if not everything OK) */}
            {everythingOk === "no" && (
              <div>
                <label className="block text-gray-700 mb-1">Adjuntar Evidencias*</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleEvidencesChange}
                  className="w-full"
                  required
                />
              </div>
            )}
            {/* Comments */}
            <div>
              <label className="block text-gray-700 mb-1">Comentarios</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comentarios adicionales (opcional)"
              ></textarea>
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors mt-4"
            >
              {isSubmitting ? "Enviando..." : "Registrar Vehículo"}
            </button>
          </form>
        </div>
      </div>
      {/* Right Column: Background Image for Large Screens */}
      <div
        className="hidden lg:flex lg:w-1/3 bg-cover bg-center"
        style={{ backgroundImage: 'url("/instalaciones-del-concesionario-de-peugeot-del-grupo-aramovil-en-huesca-y-provincia.jpg")' }}
      >
        {/* Optionally, you can add an overlay or additional branding here */}
      </div>
    </div>
  );
};

export default VehicleRegistrationForm;
