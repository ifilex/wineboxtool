var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy",
  // fallback dummy to prevent crash at initialization if missing
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var FALLBACK_SCHOOLS = [
  // Ramos Mejía
  { name: "Colegio Ward", address: "H\xE9ctor Coucheiro 599, Villa Sarmiento (L\xEDmite Ramos Mej\xEDa)", subZone: "Ramos Mej\xEDa", lat: -34.6391, lng: -58.5721 },
  { name: "Colegio Don Bosco", address: "Av. de Mayo 1902, Ramos Mej\xEDa", subZone: "Ramos Mej\xEDa", lat: -34.6521, lng: -58.5684 },
  { name: "Instituto Santo Domingo", address: "Av. San Mart\xEDn 752, Ramos Mej\xEDa", subZone: "Ramos Mej\xEDa", lat: -34.6465, lng: -58.5632 },
  { name: "Instituto Buenos Aires", address: "Av. de Mayo 1450, Ramos Mej\xEDa", subZone: "Ramos Mej\xEDa", lat: -34.6492, lng: -58.5668 },
  { name: "Colegio Santa Mar\xEDa de la R\xE1bida", address: "Guido Spano 450, Ramos Mej\xEDa", subZone: "Ramos Mej\xEDa", lat: -34.6545, lng: -58.5695 },
  { name: "Colegio Juan XXIII", address: "Av. de Mayo 949, Ramos Mej\xEDa", subZone: "Ramos Mej\xEDa", lat: -34.6472, lng: -58.5654 },
  { name: "Instituto San Francisco de As\xEDs", address: "Belgrano 553, Ramos Mej\xEDa", subZone: "Ramos Mej\xEDa", lat: -34.6441, lng: -58.5612 },
  { name: "Colegio de la Universidad de La Matanza", address: "Florencio Varela 1903, San Justo (L\xEDmite Ramos Mej\xEDa)", subZone: "Ramos Mej\xEDa", lat: -34.6702, lng: -58.5629 },
  // San Justo
  { name: "Colegio Parroquial San Justo", address: "Monse\xF1or Marcon 3020, San Justo", subZone: "San Justo", lat: -34.6782, lng: -58.5645 },
  { name: "Instituto Jean Piaget", address: "Villegas 2250, San Justo", subZone: "San Justo", lat: -34.6738, lng: -58.561 },
  { name: "Colegio Dr. Gin\xE9s de la Quintana", address: "Entre R\xEDos 2940, San Justo", subZone: "San Justo", lat: -34.6812, lng: -58.5624 },
  { name: "Colegio Palermo Chico", address: "Brandsen 3573, San Justo", subZone: "San Justo", lat: -34.6725, lng: -58.5582 },
  { name: "Instituto Educacional San Justo", address: "Salta 2331, San Justo", subZone: "San Justo", lat: -34.6751, lng: -58.5599 },
  { name: "Colegio Mar\xEDa Auxiliadora", address: "Dr. Ignacio Arieta 3060, San Justo", subZone: "San Justo", lat: -34.6775, lng: -58.5651 },
  { name: "Escuela de la Sant\xEDsima Virgen", address: "Monse\xF1or Marcon 3450, San Justo", subZone: "San Justo", lat: -34.6818, lng: -58.5689 },
  // Ciudad Evita
  { name: "Colegio Hogar de Ni\xF1os", address: "El Ruise\xF1or 120, Ciudad Evita", subZone: "Ciudad Evita", lat: -34.7123, lng: -58.5245 },
  { name: "Instituto Mar\xEDa Reina", address: "Av. Mart\xEDn Miguel de G\xFCemes 1500, Ciudad Evita", subZone: "Ciudad Evita", lat: -34.7215, lng: -58.5312 },
  { name: "Colegio Grilli Ciudad Evita", address: "La Quila 350, Ciudad Evita", subZone: "Ciudad Evita", lat: -34.718, lng: -58.528 },
  { name: "Instituto Evang\xE9lico Ciudad Evita", address: "El Ruise\xF1or 100, Ciudad Evita", subZone: "Ciudad Evita", lat: -34.7118, lng: -58.5239 },
  { name: "Colegio de las Lomas", address: "Av. G\xFCemes 4000, Ciudad Evita", subZone: "Ciudad Evita", lat: -34.7241, lng: -58.5348 },
  // González Catán
  { name: "Colegio San Mauricio", address: "Sim\xF3n P\xE9rez 4200, Gonz\xE1lez Cat\xE1n", subZone: "Gonz\xE1lez Cat\xE1n", lat: -34.769, lng: -58.625 },
  { name: "Instituto San Leopoldo", address: "Equiza 5600, Gonz\xE1lez Cat\xE1n", subZone: "Gonz\xE1lez Cat\xE1n", lat: -34.7735, lng: -58.6185 },
  { name: "Colegio Pantale\xF3n", address: "Ruta 3 Km 29, Gonz\xE1lez Cat\xE1n", subZone: "Gonz\xE1lez Cat\xE1n", lat: -34.7812, lng: -58.631 },
  { name: "Instituto Gonz\xE1lez Cat\xE1n", address: "Larre 500, Gonz\xE1lez Cat\xE1n", subZone: "Gonz\xE1lez Cat\xE1n", lat: -34.7705, lng: -58.6214 },
  // Isidro Casanova
  { name: "Colegio Sagrado Coraz\xF3n", address: "Provinciales 2200, Isidro Casanova", subZone: "Isidro Casanova", lat: -34.698, lng: -58.583 },
  { name: "Instituto de Educaci\xF3n de Casanova", address: "Marconi 4800, Isidro Casanova", subZone: "Isidro Casanova", lat: -34.7012, lng: -58.5891 },
  { name: "Colegio San Miguel", address: "Roma 3200, Isidro Casanova", subZone: "Isidro Casanova", lat: -34.6945, lng: -58.5778 },
  { name: "Instituto Almirante Brown", address: "Rep\xFAblica de Portugal 2800, Isidro Casanova", subZone: "Isidro Casanova", lat: -34.6911, lng: -58.5714 },
  // Villa Luzuriaga
  { name: "Colegio Santa Mar\xEDa", address: "Garibaldi 3200, Villa Luzuriaga", subZone: "Villa Luzuriaga", lat: -34.665, lng: -58.591 },
  { name: "Instituto Juan Bosco", address: "Venezuela 1500, Villa Luzuriaga", subZone: "Villa Luzuriaga", lat: -34.6612, lng: -58.5855 },
  { name: "Colegio Elmina Paz de Gallo", address: "Buchardo 2200, Villa Luzuriaga", subZone: "Villa Luzuriaga", lat: -34.6685, lng: -58.5942 },
  // Lomas del Mirador
  { name: "Colegio San Jos\xE9", address: "Av. San Mart\xEDn 3800, Lomas del Mirador", subZone: "Lomas del Mirador", lat: -34.661, lng: -58.535 },
  { name: "Colegio Lincoln", address: "Villegas 1200, Lomas del Mirador", subZone: "Lomas del Mirador", lat: -34.6645, lng: -58.5412 },
  { name: "Instituto Rep\xFAblica Argentina", address: "Paso 200, Lomas del Mirador", subZone: "Lomas del Mirador", lat: -34.6582, lng: -58.5299 },
  // Gregorio de Laferrere
  { name: "Colegio San Juan Bautista", address: "Luro 5800, Gregorio de Laferrere", subZone: "Gregorio de Laferrere", lat: -34.742, lng: -58.598 },
  { name: "Instituto Cristo Rey", address: "Magnasco 2500, Gregorio de Laferrere", subZone: "Gregorio de Laferrere", lat: -34.7495, lng: -58.6041 },
  { name: "Colegio San Jos\xE9 de Laferrere", address: "Luro 6100, Gregorio de Laferrere", subZone: "Gregorio de Laferrere", lat: -34.7445, lng: -58.6005 }
];
function queryLocalFallback(lat, lng, zone) {
  if (lat !== void 0 && lng !== void 0) {
    return [...FALLBACK_SCHOOLS].sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2));
      const distB = Math.sqrt(Math.pow(b.lat - lat, 2) + Math.pow(b.lng - lng, 2));
      return distA - distB;
    }).slice(0, 8);
  } else {
    const query = (zone || "San Justo").trim().toLowerCase();
    const matches = FALLBACK_SCHOOLS.filter(
      (s) => s.subZone.toLowerCase().includes(query) || s.name.toLowerCase().includes(query) || s.address.toLowerCase().includes(query)
    );
    if (matches.length > 0) {
      return matches.slice(0, 8);
    }
    return FALLBACK_SCHOOLS.filter((s) => s.subZone === "San Justo" || s.subZone === "Ramos Mej\xEDa").slice(0, 8);
  }
}
app.get("/api/all-master-schools", (req, res) => {
  res.json({ success: true, schools: FALLBACK_SCHOOLS });
});
app.post("/api/parse-pasted-schools", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ success: false, error: "No se proporcion\xF3 texto para analizar." });
  }
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY detected. Using basic regex parser.");
    const parsed = [];
    const lines = text.split(/\n+/);
    lines.forEach((line) => {
      if (line.length > 5 && (line.toLowerCase().includes("colegio") || line.toLowerCase().includes("instituto") || line.toLowerCase().includes("escuela"))) {
        const parts = line.split(/[;,|-]+/);
        const name = parts[0]?.trim() || "Colegio Importado";
        const address = parts[1]?.trim() || "Direcci\xF3n Desconocida, La Matanza, Buenos Aires";
        parsed.push({
          name,
          address,
          subZone: "San Justo",
          lat: -34.68 + (Math.random() - 0.5) * 0.05,
          lng: -58.56 + (Math.random() - 0.5) * 0.05
        });
      }
    });
    return res.json({ success: true, schools: parsed.slice(0, 10), source: "local-parser" });
  }
  try {
    const prompt = `Analice el siguiente texto de texto libre, cartelera, correo o listado web y extraiga TODOS los colegios privados reales (colegios, institutos o escuelas de gesti\xF3n privada) que se mencionen con sus respectivas direcciones f\xEDsicas.
Si las coordenadas de latitud/longitud no se especifican expl\xEDcitamente, calc\xFAlelas/est\xEDmelas con la mayor precisi\xF3n posible bas\xE1ndose en la direcci\xF3n (todas las escuelas deben ubicarse en la Rep\xFAblica Argentina, principalmente en la provincia de Buenos Aires o CABA).

Texto a analizar:
"""
${text}
"""

Responda estrictamente en formato JSON utilizando el siguiente esquema: un array de objetos, donde cada objeto contiene:
- name (string: nombre del colegio)
- address (string: direcci\xF3n real completa, ej: Av. de Mayo 1902, Ramos Mej\xEDa)
- subZone (string: localidad o subzona, ej: Ramos Mej\xEDa, San Justo, Mor\xF3n, Belgrano, etc.)
- lat (number: latitud aproximada)
- lng (number: longitud aproximada)

Retorne EXCLUSIVAMENTE el array JSON v\xE1lido, sin explicaciones ni formato markdown adicional.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              name: { type: import_genai.Type.STRING },
              address: { type: import_genai.Type.STRING },
              subZone: { type: import_genai.Type.STRING },
              lat: { type: import_genai.Type.NUMBER },
              lng: { type: import_genai.Type.NUMBER }
            },
            required: ["name", "address", "subZone", "lat", "lng"]
          }
        }
      }
    });
    const parsedSchools = JSON.parse(response.text || "[]");
    res.json({ success: true, schools: parsedSchools, source: "gemini-parser" });
  } catch (error) {
    console.error("Error parsing pasted text with Gemini:", error);
    res.status(500).json({ success: false, error: "No se pudo interpretar el texto ingresado. Verifique el formato e intente nuevamente." });
  }
});
var ZONE_COORDS = {
  "San Justo": { lat: -34.6782, lng: -58.5645 },
  "Ramos Mejia": { lat: -34.6472, lng: -58.5654 },
  "Ramos Mej\xEDa": { lat: -34.6472, lng: -58.5654 },
  "Ciudad Evita": { lat: -34.718, lng: -58.528 },
  "Gonzalez Catan": { lat: -34.7735, lng: -58.6185 },
  "Gonz\xE1lez Cat\xE1n": { lat: -34.7735, lng: -58.6185 },
  "Isidro Casanova": { lat: -34.7012, lng: -58.5891 },
  "Lomas del Mirador": { lat: -34.661, lng: -58.535 },
  "Villa Luzuriaga": { lat: -34.665, lng: -58.591 },
  "Gregorio de Laferrere": { lat: -34.7445, lng: -58.6005 }
};
app.post("/api/scrape-schools", async (req, res) => {
  const { lat, lng, zone } = req.body;
  const searchLat = lat !== void 0 ? Number(lat) : (ZONE_COORDS[zone] || ZONE_COORDS["San Justo"]).lat;
  const searchLng = lng !== void 0 ? Number(lng) : (ZONE_COORDS[zone] || ZONE_COORDS["San Justo"]).lng;
  const radius = 3e3;
  const overpassQuery = `[out:json][timeout:25];
(
  node["amenity"="school"](around:${radius}, ${searchLat}, ${searchLng});
  way["amenity"="school"](around:${radius}, ${searchLat}, ${searchLng});
  relation["amenity"="school"](around:${radius}, ${searchLat}, ${searchLng});
);
out center;`;
  try {
    console.log(`Querying OpenStreetMap Overpass API via GET at Lat: ${searchLat}, Lng: ${searchLng}`);
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    const osmResponse = await fetch(url, {
      method: "GET"
    });
    if (!osmResponse.ok) {
      throw new Error(`Overpass API responded with status ${osmResponse.status}`);
    }
    const osmData = await osmResponse.json();
    const osmSchools = [];
    if (osmData && osmData.elements && osmData.elements.length > 0) {
      for (const el of osmData.elements) {
        const latVal = el.lat !== void 0 ? el.lat : el.center ? el.center.lat : null;
        const lngVal = el.lon !== void 0 ? el.lon : el.center ? el.center.lon : null;
        if (!latVal || !lngVal) continue;
        const name = el.tags?.name || el.tags?.["official_name"] || el.tags?.["alt_name"] || `Colegio N\xB0 ${el.id}`;
        const street = el.tags?.["addr:street"] || "";
        const num = el.tags?.["addr:housenumber"] || "";
        const city = el.tags?.["addr:city"] || zone || "La Matanza";
        let address = street ? `${street} ${num}` : "";
        if (!address) {
          address = `Ubicaci\xF3n OSM ID ${el.id}, ${city}`;
        } else {
          address = `${address}, ${city}`;
        }
        osmSchools.push({
          name,
          address,
          subZone: zone || el.tags?.["addr:city"] || "La Matanza",
          lat: latVal,
          lng: lngVal
        });
      }
    }
    console.log(`Found ${osmSchools.length} schools in OpenStreetMap.`);
    if (osmSchools.length > 0) {
      return res.json({ success: true, schools: osmSchools.slice(0, 12), source: "openstreetmap" });
    } else {
      console.log("No schools returned by OSM, falling back to local database...");
      const schools = queryLocalFallback(lat, lng, zone);
      return res.json({ success: true, schools, source: "fallback" });
    }
  } catch (error) {
    console.error("Error querying OpenStreetMap Overpass API. Falling back to offline schools database:", error);
    const schools = queryLocalFallback(lat, lng, zone);
    res.json({ success: true, schools, source: "fallback" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
