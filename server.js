import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Watsonx configuration
const WATSONX_CONFIG = {
  apiKey: process.env.IBM_WATSONX_API_KEY,
  projectId: process.env.IBM_WATSONX_PROJECT_ID,
  url: process.env.IBM_WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
  modelId: process.env.IBM_WATSONX_MODEL_ID || 'ibm/granite-3-8b-instruct'
};

let accessToken = null;
let tokenExpiry = null;

// Authenticate with IBM Cloud IAM
async function authenticate() {
  try {
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    console.log('🔐 Authenticating with IBM Cloud IAM...');

    const response = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSONX_CONFIG.apiKey}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (55 * 60 * 1000);

    console.log('✅ IBM Cloud IAM authentication successful');
    return accessToken;

  } catch (error) {
    console.error('❌ IBM Cloud IAM authentication failed:', error.message);
    throw new Error('Failed to authenticate with IBM Cloud IAM');
  }
}

// Proxy endpoint for Watsonx text generation
app.post('/api/watsonx/generate', async (req, res) => {
  try {
    const { prompt, maxTokens = 2000 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const token = await authenticate();

    console.log('🤖 Calling watsonx.ai text generation...');

    const response = await axios.post(
      `${WATSONX_CONFIG.url}/ml/v1/text/generation?version=2023-05-29`,
      {
        model_id: WATSONX_CONFIG.modelId,
        project_id: WATSONX_CONFIG.projectId,
        input: prompt,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: maxTokens,
          temperature: 0.3,
          repetition_penalty: 1.05,
          stop_sequences: ['\n\n\n']
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000
      }
    );

    console.log('✅ Watsonx.ai response received');

    const generatedText = response.data.results?.[0]?.generated_text || '';
    res.json({ text: generatedText });

  } catch (error) {
    console.error('❌ Watsonx API error:', error.message);
    res.status(500).json({ 
      error: 'Watsonx API call failed',
      message: error.message 
    });
  }
});

// ============================================
// BLAST RADIUS ANALYSIS ENDPOINTS
// ============================================

// Blast Radius Analysis endpoint
app.post('/api/blast-radius/analyze', async (req, res) => {
  try {
    const { targetFile, files, repoKey } = req.body;

    if (!targetFile || !files || !repoKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: targetFile, files, repoKey' 
      });
    }

    console.log(`🎯 Blast radius analysis requested for: ${targetFile}`);

    // Dynamic import of ES modules
    const { performBlastRadiusAnalysis } = await import('./services/blastRadius.ts');
    
    const result = await performBlastRadiusAnalysis(targetFile, files, repoKey);
    
    console.log(`✅ Analysis complete: ${result.riskLevel} risk`);
    res.json(result);

  } catch (error) {
    console.error('❌ Blast radius analysis error:', error.message);
    res.status(500).json({ 
      error: 'Blast radius analysis failed',
      message: error.message 
    });
  }
});

// Graph Generation endpoint
app.post('/api/blast-radius/graph', async (req, res) => {
  try {
    const { files, repoKey } = req.body;

    if (!files || !repoKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: files, repoKey' 
      });
    }

    console.log(`🎨 Graph generation requested for ${files.length} files`);

    const { generateGraphVisualization } = await import('./services/blastRadius.ts');
    
    const result = await generateGraphVisualization(files, repoKey);
    
    console.log(`✅ Graph generated: ${result.graph.nodes.length} nodes`);
    res.json(result);

  } catch (error) {
    console.error('❌ Graph generation error:', error.message);
    res.status(500).json({ 
      error: 'Graph generation failed',
      message: error.message 
    });
  }
});

// Find most impactful files endpoint
app.post('/api/blast-radius/most-impactful', async (req, res) => {
  try {
    const { files, repoKey, limit = 10 } = req.body;

    if (!files || !repoKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: files, repoKey' 
      });
    }

    console.log(`🔍 Finding most impactful files...`);

    const { findMostImpactfulFiles } = await import('./services/blastRadius.ts');
    
    const result = await findMostImpactfulFiles(files, repoKey, limit);
    
    console.log(`✅ Found ${result.length} impactful files`);
    res.json(result);

  } catch (error) {
    console.error('❌ Most impactful files error:', error.message);
    res.status(500).json({ 
      error: 'Finding impactful files failed',
      message: error.message 
    });
  }
});

// Compare blast radius endpoint
app.post('/api/blast-radius/compare', async (req, res) => {
  try {
    const { file1, file2, files, repoKey } = req.body;

    if (!file1 || !file2 || !files || !repoKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: file1, file2, files, repoKey' 
      });
    }

    console.log(`⚖️ Comparing blast radius: ${file1} vs ${file2}`);

    const { compareBlastRadius } = await import('./services/blastRadius.ts');
    
    const result = await compareBlastRadius(file1, file2, files, repoKey);
    
    console.log(`✅ Comparison complete`);
    res.json(result);

  } catch (error) {
    console.error('❌ Blast radius comparison error:', error.message);
    res.status(500).json({ 
      error: 'Blast radius comparison failed',
      message: error.message 
    });
  }
});

// Clear cache endpoint
app.post('/api/blast-radius/clear-cache', async (req, res) => {
  try {
    const { repoKey } = req.body;

    if (!repoKey) {
      return res.status(400).json({ 
        error: 'Missing required field: repoKey' 
      });
    }

    const { clearGraphCache } = await import('./services/blastRadius.ts');
    clearGraphCache(repoKey);
    
    console.log(`🗑️ Cache cleared for: ${repoKey}`);
    res.json({ success: true, message: 'Cache cleared' });

  } catch (error) {
    console.error('❌ Clear cache error:', error.message);
    res.status(500).json({ 
      error: 'Clear cache failed',
      message: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CodePulse AI Watsonx Proxy' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 CodePulse AI Watsonx Proxy running on http://localhost:${PORT}`);
    console.log(`📡 Watsonx URL: ${WATSONX_CONFIG.url}`);
    console.log(`🤖 Model: ${WATSONX_CONFIG.modelId}`);
  });
}

export default app;

// Made with Bob

