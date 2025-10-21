// Handler básico para teste
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

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    console.log('=== TESTE BÁSICO ===');
    
    // Resposta mínima
    res.status(200).json({
      success: true,
      message: 'Teste básico OK',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('ERRO:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
