/* eslint-env node */

/**
 * Import function triggers from their respective submodules:
 *
 * 
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const functions = require("firebase-functions");
const fs = require("fs");
const path = require("path");
const vision = require("@google-cloud/vision");

// Path to temporarily store the key
const TMP_KEY_PATH = "/tmp/key.json";

// Decode the key from functions config and write to a temporary file
try {
  const base64Key = functions.config().google.application_credentials_base64;
  if (base64Key) {
    const buffer = Buffer.from(base64Key, "base64");
    fs.writeFileSync(TMP_KEY_PATH, buffer);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = TMP_KEY_PATH;
  } else {
    console.error("No base64 key found in functions config.");
  }
} catch (err) {
  console.error("Error setting up credentials:", err);
}

// Initialize the Vision client
const client = new vision.ImageAnnotatorClient();

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");


exports.extractVinFromImage = functions.https.onRequest(async (req, res) => {
    try {
      const imageUrl = req.query.imageUrl;
      if (!imageUrl) {
        res.status(400).send({ error: "Missing imageUrl parameter." });
        return;
      }
  
      // Call the Vision API for text detection
      const [result] = await client.textDetection(imageUrl);
      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        res.status(404).send({ error: "No text detected in the image." });
        return;
      }
  
      // Use the first detected text (full text)
      const fullText = detections[0].description || "";
      // Simple regex for VIN: 17 alphanumeric characters (excluding I, O, Q typically)
      const regex = /\b([A-HJ-NPR-Z0-9]{17})\b/;
      const match = fullText.match(regex);
      if (!match) {
        res.status(404).send({ error: "No VIN found in the image." });
        return;
      }
  
      res.status(200).send({ vin: match[1] });
    } catch (error) {
      console.error("Error extracting VIN:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  });
  
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
