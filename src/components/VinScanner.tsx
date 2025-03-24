import React, { useState, useRef, useEffect } from "react";

interface VinScannerProps {
  onVinScanned: (vin: string) => void;
  onCancel?: () => void;
}

const VinScanner: React.FC<VinScannerProps> = ({ onVinScanned, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // Start camera and show live preview
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No se pudo acceder a la cámara.");
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture current frame from video and store as data URL
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopCamera(); // Stop the camera once image is captured
    }
  };

  // Send captured image to Cloud Function
  const submitImage = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    setError("");
    try {
      // Extract the Base64 string (strip off the "data:image/jpeg;base64," prefix)
      const base64 = capturedImage.split(",")[1];
      // Replace <your-project-id> with your actual Firebase project ID
      const response = await fetch(
        "http://localhost:5001/ims-aramovil-dev/us-central1/extractVinFromImage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: base64 }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error al escanear VIN.");
      } else {
        onVinScanned(data.vin);
      }
    } catch (err: any) {
      console.error("Error sending image:", err);
      setError(err.message || "Error al enviar la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  // Restart the scanning process
  const retakeImage = () => {
    setCapturedImage(null);
    setError("");
    startCamera();
  };

  useEffect(() => {
    // Start camera when component mounts
    startCamera();

    // Clean up on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-semibold mb-2">Escanear VIN</h3>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!capturedImage && (
        <div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-h-64 mb-2 border"
          />
          <div className="flex space-x-2">
            <button
              onClick={captureImage}
              className="bg-green-500 text-white px-4 py-2 rounded-md"
            >
              Tomar Foto
            </button>
            <button
              onClick={() => {
                stopCamera();
                if (onCancel) onCancel();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-md"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {capturedImage && (
        <div>
          <img src={capturedImage} alt="Capturada" className="w-full mb-2 border" />
          <div className="flex space-x-2">
            <button
              onClick={retakeImage}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
              disabled={isUploading}
            >
              Reintentar
            </button>
            <button
              onClick={submitImage}
              className="bg-green-500 text-white px-4 py-2 rounded-md"
              disabled={isUploading}
            >
              {isUploading ? "Enviando..." : "Aceptar"}
            </button>
          </div>
        </div>
      )}
      {/* Hidden canvas for capturing photo */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default VinScanner;
