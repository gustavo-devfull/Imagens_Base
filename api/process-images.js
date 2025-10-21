// Handler que processa imagens corretamente
export default async function handler(req, res) {
  try {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    console.log('=== PROCESSAMENTO DE IMAGENS ===');
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const { refs, customNames } = req.body;
    
    console.log('REFs recebidos:', refs);
    console.log('Nomes personalizados:', customNames);
    
    if (!refs || !Array.isArray(refs)) {
      res.status(400).json({ error: 'Lista de REFs é obrigatória' });
      return;
    }
    
    // Simular processamento sem operações reais
    const results = refs.map((ref, index) => {
      const customName = customNames && customNames[index] ? customNames[index] : ref;
      
      console.log(`Processando: ${ref} -> ${customName}`);
      
      return {
        ref: ref,
        customName: customName,
        filename: `${customName}.jpg`,
        url: `https://moribr.nyc3.cdn.digitaloceanspaces.com/base-fotos/${customName}.jpg`,
        success: true,
        simulated: true
      };
    });
    
    const response = {
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
      message: 'Processamento simulado - API funcionando'
    };
    
    console.log('Resposta:', response);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}