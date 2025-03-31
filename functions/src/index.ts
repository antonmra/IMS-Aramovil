import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {ImageAnnotatorClient} from "@google-cloud/vision";
import {onRequest} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";


admin.initializeApp();
const visionClient = new ImageAnnotatorClient();
// Instancias de Firestore y Storage
const db = admin.firestore();
const bucket = admin.storage().bucket();

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
        res.status(405).json({error: "Method Not Allowed. Use POST."});
        return;
      }

      const imageData = req.body.imageData;
      if (!imageData) {
        res.status(400).json({error: "Missing imageData in request body"});
        return;
      }

      // Convert the Base64 string into a Buffer.
      const imageBuffer = Buffer.from(imageData, "base64");

      // Call the Cloud Vision API to perform text detection.
      const [result] = await visionClient.textDetection({image: {content: imageBuffer}});
      const detections = result.textAnnotations;
      if (!detections || detections.length === 0 || !detections[0].description) {
        res.status(404).json({error: "No text detected in image"});
        return;
      }

      const fullText = detections[0].description;
      console.log("Detected text:", fullText);

      // Return the detected text (VIN extraction logic can be refined later)
      res.status(200).json({vin: fullText.trim()});
    } catch (error: any) {
      console.error("Error in extractVinFromImage:", error);
      res.status(500).json({error: error.message});
    }
  })();
});

/**
 * Función auxiliar que genera un CSV a partir de un arreglo de objetos.
 * Cada objeto representa un evento.
 */
function generateCSV(events: any[]): string {
  if (!events || events.length === 0) {
    return "No data";
  }
  // Se usan las keys del primer objeto para los encabezados
  const headers = Object.keys(events[0]);
  const csvRows = [headers];

  events.forEach((event) => {
    const row = headers.map((header) => {
      let value = event[header];
      if (value instanceof admin.firestore.Timestamp) {
        value = value.toDate().toISOString();
      }
      // Se escapan las comillas dobles
      return `"${String(value).replace(/"/g, "\"\"")}"`;
    });
    csvRows.push(row);
  });

  return csvRows.map((row) => row.join(",")).join("\n");
}

/**
 * Función auxiliar que determina el rango de fechas para el reporte.
 * - Si es lunes: combina eventos del viernes y sábado.
 * - En otros días: toma el día anterior completo.
 */
function getReportDateRange(): { startDate: Date, endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  // getDay(): Domingo = 0, Lunes = 1, ..., Sábado = 6.
  if (now.getDay() === 1) { // Lunes: combina viernes y sábado
    const friday = new Date(now);
    friday.setDate(now.getDate() - 3);
    friday.setHours(0, 0, 0, 0);

    const saturday = new Date(now);
    saturday.setDate(now.getDate() - 2);
    saturday.setHours(23, 59, 59, 999);

    startDate = friday;
    endDate = saturday;
  } else {
    // En otros días: el día anterior completo.
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(now);
    endOfYesterday.setDate(now.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    startDate = yesterday;
    endDate = endOfYesterday;
  }

  return {startDate, endDate};
}


/**
 * Función programada reporteAutomatico:
 * Se ejecuta a las 6 AM (hora de Madrid) cada día.
 * Consulta los eventos de "EventosDelVehiculo" en el rango determinado,
 * genera un CSV y lo guarda en Storage. Además, almacena un documento en Firestore
 * (en la colección "ReportesGenerados") con los metadatos del reporte para que el front-end
 * pueda mostrar la última ejecución o proveer un enlace de descarga.
 */
export const reporteAutomatico = onSchedule({
  schedule: "0 6 * * *",
  timeZone: "Europe/Madrid",
}, async (event) => {
  try {
    const {startDate, endDate} = getReportDateRange();
    console.log(`Generando reporte automático desde ${startDate.toISOString()} hasta ${endDate.toISOString()}`);

    // Consulta a la colección de eventos
    const eventsSnapshot = await db.collection("EventosDelVehiculo")
      .where("updatedAt", ">=", startDate)
      .where("updatedAt", "<=", endDate)
      .get();

    const eventsData: any[] = [];
    eventsSnapshot.forEach((doc) => {
      eventsData.push({id: doc.id, ...doc.data()});
    });

    // Generar contenido CSV
    const csvContent = generateCSV(eventsData);

    // Nombre del archivo basado en la fecha del reporte
    const reportDateStr = startDate.toISOString().split("T")[0];
    const fileName = `reportes/reporte_${reportDateStr}.csv`;
    const file = bucket.file(fileName);

    // Guardar el archivo CSV en Storage
    await file.save(csvContent, {
      contentType: "text/csv",
    });

    // Generar una URL firmada válida por 24 horas para descargar el reporte
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: expiresAt,
    });

    // Guardar en Firestore los metadatos del reporte generado
    await db.collection("ReportesGenerados").doc("ultimoReporte").set({
      fileName,
      url,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Reporte guardado en Storage como ${fileName}`);
  } catch (error) {
    console.error("Error generando el reporte automático:", error);
  }
});

/**
 * Función HTTP reporteOnDemand:
 * Genera un CSV con los eventos de las últimas 24 horas y lo retorna en la respuesta
 * con los headers adecuados para su descarga.
 */
export const reporteOnDemand = onRequest(async (req, res) => {
  try {
    // Permitir GET o POST (puedes restringirlo si lo prefieres)
    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).json({error: "Method Not Allowed. Use GET or POST."});
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Consulta a la colección de eventos de las últimas 24 horas
    const eventsSnapshot = await db.collection("EventosDelVehiculo")
      .where("updatedAt", ">=", startDate)
      .get();

    const eventsData: any[] = [];
    eventsSnapshot.forEach((doc) => {
      eventsData.push({id: doc.id, ...doc.data()});
    });

    const csvContent = generateCSV(eventsData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"reporte_24h.csv\"");
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error generando el reporte on-demand:", error);
    res.status(500).json({error: "Internal Server Error"});
  }
});
