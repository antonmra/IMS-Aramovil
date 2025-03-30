// src/components/VehicleRegistrationForm.tsx
import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, storage, auth } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import VinScanner from "./VinScanner";
import CarPhotoCapture from "./CarPhotoCapture";

const VehicleRegistrationForm: React.FC = () => {
  // Estado del formulario dividido en 3 pasos
  const [currentStep, setCurrentStep] = useState(1);

  // Paso 1: Operario y Ubicación
  const [operator, setOperator] = useState("");
  const [location, setLocation] = useState("Nave");

  // Paso 2: Información básica del vehículo
  const [vin, setVin] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [maker, setMaker] = useState("");
  const [otherMaker, setOtherMaker] = useState("");
  const [model, setModel] = useState("");

  // Paso 3: Comprobación
  const [verificado, setVerificado] = useState("no");
  const [todoOk, setTodoOk] = useState("no");
  const [comments, setComments] = useState("");

  // Foto del vehículo
  const [carPictureFile, setCarPictureFile] = useState<File | null>(null);
  const [carPictureURL, setCarPictureURL] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  // Otros estados
  const [registrationStarted, setRegistrationStarted] = useState<Date | null>(null);
  const [registrationEnded, setRegistrationEnded] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showVinScanner, setShowVinScanner] = useState(false);

  // El campo "disponibilidad" se fija a "Para matricular" y no se muestra en la UI.
  const disponibilidad = "Para matricular";

  // Función para subir archivos a Firebase Storage
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // Control de pasos
  const handleNextStep = () => {
    // Validaciones según el paso
    if (currentStep === 1 && !operator) {
      setErrorMsg("El operador es obligatorio.");
      return;
    }
    if (currentStep === 2 && (!vin || !maker)) {
      setErrorMsg("El VIN y el fabricante son obligatorios.");
      return;
    }
    setErrorMsg("");
    setCurrentStep(currentStep + 1);
  };

  const handleBackStep = () => {
    setErrorMsg("");
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    // Validaciones finales
    if (!operator || !vin || !maker) {
      setErrorMsg("Faltan campos obligatorios.");
      setIsSubmitting(false);
      return;
    }
    if (!carPictureFile) {
      setErrorMsg("La foto del vehículo es obligatoria.");
      setIsSubmitting(false);
      return;
    }

    // Determinar fabricante final
    const finalMaker = maker === "OTROS" && otherMaker.trim() !== "" ? otherMaker : maker;

    try {
      // Subir foto del vehículo
      const carPicPath = `carPictures/${Date.now()}_${carPictureFile.name}`;
      const carPicURL = await uploadFile(carPictureFile, carPicPath);
      setCarPictureURL(carPicURL);

      const startTime = registrationStarted ? registrationStarted : new Date();
      const endTime = new Date();
      setRegistrationEnded(endTime);
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;

      // Crear objeto a guardar, incluyendo disponibilidad fija
      const vehicleData = {
        operator,
        location,
        timestamp_start: startTime,
        vin,
        number_plate: numberPlate,
        maker: finalMaker,
        model,
        car_picture: carPicURL,
        verificado,      // Paso 3
        todo_ok: todoOk, // Paso 3
        comments,
        disponibilidad, // Siempre "Para matricular"
        timestamp_end: endTime,
        registry_duration: duration,
      };

      // Guardar en la colección "vehiculos" (en español)
      const vehiculosCollection = collection(db, "vehiculos");
      await addDoc(vehiculosCollection, vehicleData);

      alert("¡Vehículo registrado correctamente!");

      // Reiniciar el formulario
      setOperator("");
      setLocation("Nave");
      setVin("");
      setNumberPlate("");
      setMaker("");
      setOtherMaker("");
      setModel("");
      setCarPictureFile(null);
      setCarPictureURL("");
      setVerificado("no");
      setTodoOk("no");
      setComments("");
      setRegistrationStarted(new Date());
      setRegistrationEnded(null);
      setCurrentStep(1);
      setShowVinScanner(false);
      setShowCamera(false);
    } catch (err: any) {
      console.error("Error registrando vehículo:", err);
      setErrorMsg("Error registrando vehículo: " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("Sesión cerrada correctamente");
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleVinScanned = (scannedVin: string) => {
    setVin(scannedVin);
    setShowVinScanner(false);
  };

  const handlePhotoCaptured = (file: File, dataUrl: string) => {
    setCarPictureFile(file);
    setCarPictureURL(dataUrl);
    setShowCamera(false);
  };

  useEffect(() => {
    setRegistrationStarted(new Date());
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-auto">
      {/* Fondo con overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/instalaciones zaragoza.png')" }}
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

      {/* Contenedor principal */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-2/3 p-4 md:p-6 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-3xl mx-auto">
            <div className="h-2 bg-green-600 w-full"></div>
            <div className="p-6">
              {/* Logo y Título */}
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
                {currentStep === 1 && (
                  <>
                    {/* Paso 1: Operario y Ubicación */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">Operador*</label>
                      <select
                        value={operator}
                        onChange={(e) => setOperator(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Seleccionar Operador</option>
                        <option value="Operator A">Operator A</option>
                        <option value="Operator B">Operator B</option>
                        <option value="Operator C">Operator C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">Ubicación*</label>
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
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
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {/* Paso 2: Información básica del vehículo */}
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">VIN*</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={vin}
                          onChange={(e) => setVin(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ingrese VIN manualmente o escanee"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowVinScanner(!showVinScanner)}
                          className="ml-2 bg-blue-500 text-white px-3 py-2 rounded-md text-sm"
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
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">Matrícula</label>
                      {numberPlate.trim() !== "" ? (
                        <input
                          type="text"
                          value={numberPlate}
                          readOnly
                          className="w-full border border-gray-300 p-3 rounded-md bg-gray-100 text-gray-900"
                        />
                      ) : (
                        <input
                          type="text"
                          value={numberPlate}
                          onChange={(e) => setNumberPlate(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-md bg-yellow-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ingrese matrícula (editable)"
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Fabricante*</label>
                        <select
                          value={maker}
                          onChange={(e) => setMaker(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        >
                          <option value="">Seleccionar Fabricante</option>
                          <option value="Abarth">Abarth</option>
                          <option value="Citroen">Citroen</option>
                          <option value="DS">DS</option>
                          <option value="Fiat">Fiat</option>
                          <option value="Lancia">Lancia</option>
                          <option value="Opel">Opel</option>
                          <option value="Peugeot">Peugeot</option>
                          <option value="MG">MG</option>
                          <option value="Mitsubishi">Mitsubishi</option>
                          <option value="Toyota">Toyota</option>
                          <option value="OTROS">OTROS</option>
                        </select>
                        {maker === "OTROS" && (
                          <div className="mt-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                              Indique el fabricante
                            </label>
                            <input
                              type="text"
                              value={otherMaker}
                              onChange={(e) => setOtherMaker(e.target.value)}
                              className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Especifique el fabricante (opcional)"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Modelo</label>
                        <input
                          type="text"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ingrese el modelo (opcional)"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    {/* Paso 3: Comprobación */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Verificado del coche</label>
                        <select
                          value={verificado}
                          onChange={(e) => setVerificado(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="no">No</option>
                          <option value="sí">Sí</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">OK al estado</label>
                        <select
                          value={todoOk}
                          onChange={(e) => setTodoOk(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="no">No</option>
                          <option value="sí">Sí</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2">Foto del Vehículo</label>
                      {!showCamera && !carPictureURL && (
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md"
                        >
                          Abrir Cámara
                        </button>
                      )}
                      {showCamera && (
                        <div className="mb-4">
                          <CarPhotoCapture onPhotoCaptured={handlePhotoCaptured} onCancel={() => setShowCamera(false)} />
                        </div>
                      )}
                      {carPictureURL && (
                        <div className="mt-2">
                          <img src={carPictureURL} alt="Foto Capturada" className="w-full max-h-64 object-cover border" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2">Comentarios</label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full border border-gray-300 p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Comentarios adicionales (opcional)"
                        rows={4}
                      ></textarea>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleBackStep}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {isSubmitting ? "Enviando..." : "REGISTRAR VEHÍCULO"}
                      </button>
                    </div>
                  </>
                )}
              </form>

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
                <img src="/logo grupo Aramovil b-g.png" alt="Aramovil Logo" className="h-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistrationForm;
