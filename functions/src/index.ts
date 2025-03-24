import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ImageAnnotatorClient } from "@google-cloud/vision";

admin.initializeApp();
const visionClient = new ImageAnnotatorClient();

export const extractVinFromImage = functions.https.onRequest((req, res) => {
  // Set CORS headers so the browser accepts cross-origin requests.
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request.
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Log request information for troubleshooting.
  console.log("Request received. Method:", req.method);
  console.log("Request body:", req.body);

  (async () => {
    try {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed. Use POST." });
        return;
      }

      const imageData = req.body.imageData;
      if (!imageData) {
        res.status(400).json({ error: "Missing imageData in request body" });
        return;
      }

      // Convert the Base64 string into a Buffer.
      const imageBuffer = Buffer.from(imageData, "base64");

      // Call the Cloud Vision API to perform text detection.
      const [result] = await visionClient.textDetection({ image: { content: imageBuffer } });
      const detections = result.textAnnotations;
      if (!detections || detections.length === 0 || !detections[0].description) {
        res.status(404).json({ error: "No text detected in image" });
        return;
      }

      const fullText = detections[0].description;
      console.log("Detected text:", fullText);

      // Return the detected text (VIN extraction logic can be refined later)
      res.status(200).json({ vin: fullText.trim() });
    } catch (error: any) {
      console.error("Error in extractVinFromImage:", error);
      res.status(500).json({ error: error.message });
    }
  })();
});
