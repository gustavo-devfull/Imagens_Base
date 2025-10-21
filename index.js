const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const axios = require('axios');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: 'DO00U3TGARCUQ4BBXLUF',
  secretAccessKey: '2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM',
  region: 'nyc3',
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

// Configuração do multer para upload de arquivos
const upload = multer({ 
  dest: 'uploads/',
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

// Função para ler planilha Excel
function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw new Error(`Erro ao ler arquivo Excel: ${error.message}`);
  }
}

// Função para ler arquivo CSV
function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(new Error(`Erro ao ler arquivo CSV: ${error.message}`)));
  });
}

// Função para baixar imagem
async function downloadImage(url, filename) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
    
    const filePath = path.join(__dirname, 'temp', filename);
    
    // Criar diretório temp se não existir
    if (!fs.existsSync(path.join(__dirname, 'temp'))) {
      fs.mkdirSync(path.join(__dirname, 'temp'));
    }
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Erro ao baixar imagem: ${error.message}`);
  }
}

// Função para fazer upload para DigitalOcean Spaces
async function uploadToSpaces(filePath, key) {
  try {
    const fileContent = fs.readFileSync(filePath);
    
    const params = {
      Bucket: 'moribr',
      Key: `base-fotos/${key}`,
      Body: fileContent,
      ACL: 'public-read',
      ContentType: 'image/jpeg'
    };
    
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }
}

// Rota para upload da planilha
app.post('/upload-spreadsheet', upload.single('spreadsheet'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    let data;
    
    if (fileExt === '.csv') {
      data = await readCSVFile(filePath);
    } else {
      data = readExcelFile(filePath);
    }
    
    // Limpar arquivo temporário
    fs.unlinkSync(filePath);
    
    // Verificar se existe campo REF
    if (data.length === 0) {
      return res.status(400).json({ error: 'Planilha vazia' });
    }
    
    const firstRow = data[0];
    const refField = Object.keys(firstRow).find(key => 
      key.toLowerCase().includes('ref') || 
      key.toLowerCase().includes('referencia') ||
      key.toLowerCase().includes('código')
    );
    
    if (!refField) {
      return res.status(400).json({ error: 'Campo REF não encontrado na planilha' });
    }
    
    // Filtrar apenas linhas com REF válido
    const validRows = data.filter(row => row[refField] && row[refField].toString().trim() !== '');
    
    res.json({
      success: true,
      data: validRows,
      refField: refField,
      totalRows: validRows.length
    });
    
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para processar imagens
app.post('/process-images', async (req, res) => {
  try {
    const { refs, customNames } = req.body;
    
    console.log('Dados recebidos:', { refs, customNames });
    
    if (!refs || !Array.isArray(refs)) {
      return res.status(400).json({ error: 'Lista de REFs é obrigatória' });
    }
    
    const results = [];
    
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      const customName = customNames && customNames[i] ? customNames[i] : ref;
      
      console.log(`Processando REF ${ref} -> Nome personalizado: ${customName}`);
      
      try {
        const imageUrl = `https://ideolog.ia.br/images/products/${ref}.jpg`;
        const filename = `${customName}.jpg`;
        
        // Baixar imagem usando o REF original
        const tempPath = await downloadImage(imageUrl, `${ref}.jpg`);
        
        // Upload para Spaces usando o nome personalizado
        const spacesUrl = await uploadToSpaces(tempPath, filename);
        
        // Limpar arquivo temporário
        fs.unlinkSync(tempPath);
        
        console.log(`Sucesso: ${ref} -> ${filename} -> ${spacesUrl}`);
        
        results.push({
          ref: ref,
          customName: customName,
          filename: filename,
          url: spacesUrl,
          success: true
        });
        
      } catch (error) {
        console.error(`Erro ao processar ${ref}:`, error.message);
        results.push({
          ref: ref,
          customName: customName,
          filename: `${customName}.jpg`,
          error: error.message,
          success: false
        });
      }
    }
    
    res.json({
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length
    });
    
  } catch (error) {
    console.error('Erro no processamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para testar conexão com Spaces
app.get('/test-spaces', async (req, res) => {
  try {
    const params = {
      Bucket: 'moribr',
      Prefix: 'base-fotos/',
      MaxKeys: 1
    };
    
    const result = await s3.listObjectsV2(params).promise();
    res.json({ 
      success: true, 
      message: 'Conexão com DigitalOcean Spaces OK',
      bucketContents: result.Contents ? result.Contents.length : 0
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Servir arquivos estáticos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
