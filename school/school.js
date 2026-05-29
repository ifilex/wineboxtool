// school-config.js - Archivo de configuración por escuela
const SCHOOL_CONFIG = {
  // Datos identificatorios fijos de la escuela
  id: "ESC_PRIMARIA_NRO_123",           // ← ID ÚNICO para esta escuela
  nombre: "Escuela Primaria N° 123",
  nombreCorto: "EP N°123",
  
  // Datos de contacto de la escuela (fijos)
  emailInstitucional: "informes@escuela123.edu.ar",
  telefono: "011-1234-5678",
  
  // Personalización visual
  logoUrl: "https://tuservidor.com/logos/escuela123.png",
  colorPrimario: "#24389c",    // Color principal de la escuela
  colorSecundario: "#006a62",
  
  // Dónde enviar copia de TODOS los informes (puede ser una planilla de Google)
  destinoCopiaInstitucional: "neurotest@escuela123.edu.ar",
  
  // API Key para verificar que los datos vienen de esta escuela (opcional)
  apiKey: "escuela123_secret_key_2025"
};

// Si necesitas exponerlo globalmente
if (typeof window !== 'undefined') {
  window.SCHOOL_CONFIG = SCHOOL_CONFIG;
}