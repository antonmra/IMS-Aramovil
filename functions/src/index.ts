import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import fetch from "node-fetch";

admin.initializeApp();
const visionClient = new ImageAnnotatorClient();

export const extractVinFromImage = functions.https.onRequest(async (req, res) => {
  try {
    const imageUrl = req.query.imageUrl as string;
    if (!imageUrl) {
      res.status(400).json({ error: "Missing imageUrl parameter" });
      return;
    }

    // Download the image bytes from Firebase Storage (or any accessible URL)
    const response = await fetch(imageUrl);
    if (!response.ok) {
      res
        .status(500)
        .json({ error: `Failed to download image, status: ${response.status}` });
      return;
    }
    const imageBuffer = await response.buffer();

    // Call the Cloud Vision API with the image content
    const [result] = await visionClient.textDetection({ image: { content: imageBuffer } });
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      res.status(404).json({ error: "No text detected in image" });
      return;
    }

    // The first annotation usually contains the full detected text
    // Check that fullText exists before proceeding.
    const fullText = detections[0].description;
    if (!fullText) {
        res.status(404).json({ error: "No text detected in image" });
        return;
    }

    // You can add regex or additional parsing logic here to specifically extract the VIN

    res.status(200).json({ vin: fullText.trim() });
  } catch (error: any) {
    console.error("Error in extractVinFromImage:", error);
    res.status(500).json({ error: error.message });
  }
});
