// src/components/VehicleRegistrationForm.tsx
import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, storage, auth } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";

const VehicleRegistrationForm = () => {
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
    // Dummy logic: if VIN starts with "1", return "Toyota", else "Ford"
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

      // If VIN is not provided but car picture is (in case you want to auto-extract)
      let finalVin = vin;
      if (!vin && carPictureFile) {
        finalVin = await extractVinFromImage(carPictureFile);
        setVin(finalVin);
      }

      // Determine maker based on VIN
      const finalMaker = determineMakerFromVin(finalVin);
      setMaker(finalMaker);

      // Upload car picture
      const carPicPath = `carPictures/${Date.now()}_${carPictureFile.name}`;
      const carPicURL = await uploadFile(carPictureFile, carPicPath);
      setCarPictureURL(carPicURL);

      // Upload evidences if necessary
      let evidencesURLsLocal: string[] = [];
      if (everythingOk === "no" && evidencesFiles.length > 0) {
        for (const file of evidencesFiles) {
          const evidencePath = `evidences/${Date.now()}_${file.name}`;
          const url = await uploadFile(file, evidencePath);
          evidencesURLsLocal.push(url);
        }
        setEvidencesURLs(evidencesURLsLocal);
      }

      // Capture timestamps
      const startTime = registrationStarted ? registrationStarted : new Date();
      const endTime = new Date();
      setRegistrationEnded(endTime);
      const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds

      // Construct vehicle document data
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

      // Save the document to Firestore
      const vehiclesCollection = collection(db, "vehicles");
      await addDoc(vehiclesCollection, vehicleData);

      alert("Vehicle registered successfully!");

      // Optionally, reset the form
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
  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Optionally, you can redirect to the login page here if needed.
      alert("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error);
    }
  };
  // Start the registration timer when the component mounts
  useEffect(() => {
    setRegistrationStarted(new Date());
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">New Vehicle Registration</h2>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      <form onSubmit={handleSubmit}>
        {/* Operator selection */}
        <div className="mb-4">
          <label className="block mb-1">Operator*</label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Operator</option>
            <option value="Operator A">Operator A</option>
            <option value="Operator B">Operator B</option>
            <option value="Operator C">Operator C</option>
          </select>
        </div>
        {/* VIN input */}
        <div className="mb-4">
          <label className="block mb-1">VIN Number*</label>
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Enter VIN manually or scan"
            required
          />
        </div>
        {/* Number plate */}
        <div className="mb-4">
          <label className="block mb-1">Number Plate</label>
          <input
            type="text"
            value={numberPlate}
            onChange={(e) => setNumberPlate(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Enter number plate (if available)"
          />
        </div>
        {/* Maker (auto-filled) */}
        <div className="mb-4">
          <label className="block mb-1">Maker</label>
          <input
            type="text"
            value={maker}
            readOnly
            className="w-full border p-2 rounded bg-gray-100"
          />
        </div>
        {/* Model */}
        <div className="mb-4">
          <label className="block mb-1">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Enter model (optional)"
          />
        </div>
        {/* Car picture */}
        <div className="mb-4">
          <label className="block mb-1">Car Picture*</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCarPictureChange}
            className="w-full"
            required
          />
        </div>
        {/* State verified */}
        <div className="mb-4">
          <label className="block mb-1">State Verified?*</label>
          <select
            value={stateVerified}
            onChange={(e) => setStateVerified(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {/* Everything OK */}
        <div className="mb-4">
          <label className="block mb-1">Everything OK?*</label>
          <select
            value={everythingOk}
            onChange={(e) => setEverythingOk(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {/* Evidence upload (if not everything OK) */}
        {everythingOk === "no" && (
          <div className="mb-4">
            <label className="block mb-1">Attach Evidences*</label>
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
        <div className="mb-4">
          <label className="block mb-1">Comments</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Any additional comments"
          ></textarea>
        </div>
        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-500 text-white p-2 rounded w-full"
        >
          {isSubmitting ? "Submitting..." : "Register Vehicle"}
        </button>
      </form>
    </div>
  );
};

export default VehicleRegistrationForm;
