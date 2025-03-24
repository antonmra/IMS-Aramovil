import type React from "react";
import { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, storage, auth } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import VinScanner from "./VinScanner";

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
  const [showVinScanner, setShowVinScanner] = useState(false);

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

      const finalMaker = determineMakerFromVin(vin);
      setMaker(finalMaker);

      const carPicPath = `carPictures/${Date.now()}_${carPictureFile.name}`;
      const carPicURL = await uploadFile(carPictureFile, carPicPath);
      setCarPictureURL(carPicURL);

      const evidencesURLsLocal: string[] = [];
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
        vin,
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

  const handleVinScanned = (scannedVin: string) => {
    setVin(scannedVin);
    setShowVinScanner(false);
  };

  useEffect(() => {
    setRegistrationStarted(new Date());
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-auto">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/instalaciones zaragoza.png')" }}
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
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* Form Section */}
        <div className="w-full md:w-2/3 p-4 md:p-6 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-3xl mx-auto">
            <div className="h-2 bg-green-600 w-full"></div>
            <div className="p-6">
              {/* Logo and Title */}
              <div className="flex flex-col sm:flex-row items-center mb-6">
                <img
                  src="/logo grupo Aramovil b-g.png"
                  alt="Aramovil Logo"
                  className="h-10 mb-3 sm:mb-0"
                />
                <h2 className="text-xl font-bold text-gray-800 sm:ml-4">
                  Nuevo Registro de Vehículo
                </h2>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <p className="text-red-700 text-sm">{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Operator Selection */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Operador*
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar Operador</option>
                    <option value="Operator A">Operator A</option>
                    <option value="Operator B">Operator B</option>
                    <option value="Operator C">Operator C</option>
                  </select>
                </div>

                {/* VIN Input and Scanner */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    VIN*
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                      className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ingrese VIN manualmente o escanee"
                      required
                    />
                    <button
                      type="button"
                      className="ml-2 bg-blue-500 text-white px-3 py-2 rounded-md text-sm"
                      onClick={() => setShowVinScanner(!showVinScanner)}
                    >
                      {showVinScanner ? "Cerrar Escáner" : "Escanear VIN"}
                    </button>
                  </div>
                </div>
                {showVinScanner && (
                  <div className="mb-4">
                    <VinScanner onVinScanned={handleVinScanned} onCancel={() => setShowVinScanner(false)} />
                  </div>
                )}

                {/* Number Plate */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={numberPlate}
                    onChange={(e) => setNumberPlate(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ingrese matrícula (si está disponible)"
                  />
                </div>

                {/* Two Columns: Maker & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Fabricante
                    </label>
                    <input
                      type="text"
                      value={maker}
                      readOnly
                      className="w-full border border-gray-300 p-3 rounded-md bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ingrese el modelo (opcional)"
                    />
                  </div>
                </div>

                {/* Car Picture Upload */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Foto del Vehículo*
                  </label>
                  <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCarPictureChange}
                      className="w-full"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Formatos aceptados: JPG, PNG, HEIC
                    </p>
                  </div>
                </div>

                {/* Two Columns: State Verified & Everything OK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Estado Verificado?*
                    </label>
                    <select
                      value={stateVerified}
                      onChange={(e) => setStateVerified(e.target.value)}
                      className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="yes">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      ¿Todo OK?*
                    </label>
                    <select
                      value={everythingOk}
                      onChange={(e) => setEverythingOk(e.target.value)}
                      className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="yes">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                {/* Evidence Upload (if not everything OK) */}
                {everythingOk === "no" && (
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Adjuntar Evidencias*
                    </label>
                    <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleEvidencesChange}
                        className="w-full"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Puede seleccionar múltiples archivos
                      </p>
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Comentarios
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Comentarios adicionales (opcional)"
                    rows={4}
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {isSubmitting ? "Enviando..." : "REGISTRAR VEHÍCULO"}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                © {new Date().getFullYear()} Grupo Aramovil. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Decorative Section */}
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

export default VehicleRegistrationForm;
