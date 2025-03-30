// src/components/CarPhotoCapture.tsx
import React, { useState, useRef, useEffect } from "react";

interface CarPhotoCaptureProps {
  onPhotoCaptured: (file: File, dataUrl: string) => void;
  onCancel?: () => void;
}

const CarPhotoCapture: React.FC<CarPhotoCaptureProps> = ({ onPhotoCaptured, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState("");

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

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

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
      stopCamera();
    }
  };

  // Convierte dataURL a File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const acceptPhoto = () => {
    if (capturedImage) {
      const file = dataURLtoFile(capturedImage, `car_${Date.now()}.jpg`);
      onPhotoCaptured(file, capturedImage);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError("");
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-semibold mb-2">Tomar Foto del Vehículo</h3>
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
          <img src={capturedImage} alt="Foto Capturada" className="w-full mb-2 border" />
          <div className="flex space-x-2">
            <button
              onClick={retakePhoto}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Reintentar
            </button>
            <button
              onClick={acceptPhoto}
              className="bg-green-500 text-white px-4 py-2 rounded-md"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
      {/* Canvas oculto para capturar la imagen */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CarPhotoCapture;
