const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Configuração do DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_ACCESS_KEY || 'DO00U3TGARCUQ4BBXLUF',
  secretAccessKey: process.env.DO_SECRET_KEY || '2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM',
  region: 'nyc3',
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

// Configuração do multer para upload de arquivos (memória para Vercel)
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel (.xlsx, .xls) e CSV são permitidos'));
    }
  }
});

// Função para ler planilha Excel da memória
function readExcelFromBuffer(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw new Error(`Erro ao ler arquivo Excel: ${error.message}`);
  }
}

// Função para ler arquivo CSV da memória
function readCSVFromBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    
    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(new Error(`Erro ao ler arquivo CSV: ${error.message}`)));
  });
}

// Middleware para CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Handler principal
export default async function handler(req, res) {
  // Configurar CORS
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    return new Promise((resolve) => {
      upload.single('spreadsheet')(req, res, async (err) => {
        if (err) {
          res.status(400).json({ error: err.message });
          resolve();
          return;
        }

        try {
          if (!req.file) {
            res.status(400).json({ error: 'Nenhum arquivo enviado' });
            resolve();
            return;
          }
          
          const fileBuffer = req.file.buffer;
          const fileExt = path.extname(req.file.originalname).toLowerCase();
          
          let data;
          
          if (fileExt === '.csv') {
            data = await readCSVFromBuffer(fileBuffer);
          } else {
            data = readExcelFromBuffer(fileBuffer);
          }
          
          // Verificar se existe campo REF
          if (data.length === 0) {
            res.status(400).json({ error: 'Planilha vazia' });
            resolve();
            return;
          }
          
          const firstRow = data[0];
          const refField = Object.keys(firstRow).find(key => 
            key.toLowerCase().includes('ref') || 
            key.toLowerCase().includes('referencia') ||
            key.toLowerCase().includes('código')
          );
          
          if (!refField) {
            res.status(400).json({ error: 'Campo REF não encontrado na planilha' });
            resolve();
            return;
          }
          
          // Filtrar apenas linhas com REF válido
          const validRows = data.filter(row => row[refField] && row[refField].toString().trim() !== '');
          
          res.json({
            success: true,
            data: validRows,
            refField: refField,
            totalRows: validRows.length
          });
          resolve();
          
        } catch (error) {
          console.error('Erro no upload:', error);
          res.status(500).json({ error: error.message });
          resolve();
        }
      });
    });
    
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
}

export default handler;
