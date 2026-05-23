import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Gemini / AIML API configuration
const GEMINI_CONFIG = {
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  modelId: process.env.GOOGLE_GEMINI_MODEL_ID || 'gemini-2.5-flash',
  url: 'https://generativelanguage.googleapis.com/v1beta/models'
};

// AIML API (third-party) configuration - when present we'll prefer AIML as a proxy
const AIML_CONFIG = {
  apiKey: process.env.AIMLAPI_KEY,
  url: process.env.AIMLAPI_URL?.replace(/\/$/, '') || 'https://api.aimlapi.com',
  model: process.env.AIMLAPI_MODEL || 'google/gemini-2.5-flash'
};

console.log('🔧 Loaded server configuration:', {
  aimlEnabled: !!AIML_CONFIG.apiKey,
  aimlUrl: AIML_CONFIG.url,
  aimlModel: AIML_CONFIG.model,
  geminiEnabled: !!GEMINI_CONFIG.apiKey,
  geminiModel: GEMINI_CONFIG.modelId
});

// Proxy endpoint for Gemini text generation (supports AIML proxy if configured)
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, maxTokens = 2000, responseType = 'text' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // If an AIML API key is provided, call the AIML provider first
    if (AIML_CONFIG.apiKey) {
      console.log('🤖 Calling AIML API proxy...');
      try {
        const baseUrl = AIML_CONFIG.url.replace(/\/$/, '');
        const endpoint = baseUrl.endsWith('/v1') 
          ? `${baseUrl}/chat/completions` 
          : `${baseUrl}/v1/chat/completions`;

        const payload = {
          model: AIML_CONFIG.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.3
        };

        if (responseType === 'json') {
          payload.response_format = { type: 'json_object' };
        }

        const aimlResp = await axios.post(
          endpoint,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${AIML_CONFIG.apiKey}`
            },
            timeout: 60000
          }
        );

        console.log('✅ AIML API response received');

        // Try several common response shapes
        const textCandidate =
          aimlResp.data?.choices?.[0]?.message?.content ||
          aimlResp.data?.text ||
          aimlResp.data?.generated_text ||
          aimlResp.data?.output?.[0]?.text ||
          aimlResp.data?.data?.[0]?.text ||
          (typeof aimlResp.data === 'string' ? aimlResp.data : undefined) ||
          '';

        return res.json({ text: textCandidate });
      } catch (err) {
        console.error('❌ AIML API error:', err?.message || err);
        if (err.response?.data) console.error('Response data:', err.response.data);
        // fallthrough to try Google Gemini if available
      }
    }

    // Fallback: call Google Generative API if configured
    if (!GEMINI_CONFIG.apiKey) {
      return res.status(500).json({ 
        error: 'No API provider configured',
        message: 'Set AIMLAPI_KEY or GOOGLE_GEMINI_API_KEY environment variable'
      });
    }

    console.log('🤖 Calling Google AI endpoint...');

    const generationConfig = {
      temperature: 0.3,
      maxOutputTokens: maxTokens,
      topP: 0.95,
      topK: 40
    };

    if (responseType === 'json') {
      generationConfig.responseMimeType = "application/json";
    }

    const response = await axios.post(
      `${GEMINI_CONFIG.url}/${GEMINI_CONFIG.modelId}:generateContent?key=${GEMINI_CONFIG.apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    console.log('✅ Google AI response received');

    const candidate = response.data.candidates?.[0] || {};
    const generatedText =
      candidate?.content?.parts?.[0]?.text ||
      candidate?.content?.[0]?.text ||
      candidate?.output?.[0]?.content ||
      candidate?.content ||
      '';
    res.json({ text: generatedText });

  } catch (error) {
    console.error('❌ Gemini/AIML API error:', error.message || error);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Gemini/AIML API call failed',
      message: error.message || String(error) 
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
  res.json({ status: 'ok', service: 'CodePulse AI API Proxy' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 CodePulse AI proxy running on http://localhost:${PORT}`);
    console.log(`📡 AI model: ${GEMINI_CONFIG.modelId}`);
  });
}

export default app;

