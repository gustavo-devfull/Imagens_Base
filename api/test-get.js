// Handler que aceita GET para teste
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

    console.log('=== TESTE GET ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Resposta simples
    res.status(200).json({
      success: true,
      message: 'Teste GET funcionando',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
    
  } catch (error) {
    console.error('ERRO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
