import axios from 'axios';
import { AnalysisResult, FileContent, AnalysisMode, FileAnalysisResult } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

class GeminiService {
  /**
   * Call the AI backend proxy for generation
   */
  private async callGemini(prompt: string, maxTokens: number = 2000, responseType: 'json' | 'text' = 'text'): Promise<string> {
    try {
      console.log('🤖 Calling AI backend via proxy...');

      const response = await axios.post<{ text: string }>(
        `${BACKEND_URL}/api/gemini/generate`,
        {
          prompt,
          maxTokens,
          responseType
        },
        {
          timeout: 60000 // 60 second timeout for large repos
        }
      );

      console.log('✅ AI backend response received');
      return response.data.text;

    } catch (error: any) {
      if (error.response) {
        console.error('❌ AI backend error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('❌ AI backend network error: No response received');
      } else {
        console.error('❌ AI backend request error:', error.message);
      }
      throw new Error('Failed to call AI backend: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Parse JSON from AI response with robust fallback parsing
   */
  private parseGeminiResponse<T>(text: string): T {
    const cleaned = this.cleanJsonOutput(text);
    try {
      return JSON.parse(cleaned);
    } catch (e: any) {
      console.warn('⚠️ Direct JSON.parse failed. Attempting robust JS object evaluation fallback...');
      try {
        // Fallback: Use safe evaluation since LLMs often produce JS-like syntax (single quotes, trailing commas, etc.)
        // We wrap in parentheses to force it to be evaluated as an expression
        const evaluator = new Function(`return (${cleaned})`);
        const result = evaluator();
        if (result && typeof result === 'object') {
          return result as T;
        }
        throw new Error('Evaluated result is not an object');
      } catch (fallbackErr: any) {
        console.error('❌ Direct JSON parse failed:', e.message, 'Cleaned input:', cleaned);
        console.error('❌ Robust fallback evaluation also failed:', fallbackErr.message);
        console.error('Original response text:', text);
        throw new Error(`Could not parse JSON from Gemini response: ${e.message}`);
      }
    }
  }

  /**
   * Clean JSON output by removing markdown code blocks and repairing common syntax issues
   */
  private cleanJsonOutput(text: string): string {
    let s = text.trim();
    
    // 1. Remove markdown code blocks if present
    if (s.startsWith('```json')) {
      s = s.substring(7);
    } else if (s.startsWith('```')) {
      s = s.substring(3);
    }
    if (s.endsWith('```')) {
      s = s.substring(0, s.length - 3);
    }
    s = s.trim();

    // Find first { or [
    const firstBrace = s.indexOf('{');
    const firstBracket = s.indexOf('[');
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }

    // Find last } or ]
    const lastBrace = s.lastIndexOf('}');
    const lastBracket = s.lastIndexOf(']');
    let endIdx = -1;
    if (lastBrace !== -1 && lastBracket !== -1) {
      endIdx = Math.max(lastBrace, lastBracket);
    } else if (lastBrace !== -1) {
      endIdx = lastBrace;
    } else if (lastBracket !== -1) {
      endIdx = lastBracket;
    }

    if (startIdx !== -1) {
      // If we found a starting brace/bracket, slice from there
      if (endIdx !== -1 && endIdx > startIdx) {
        s = s.substring(startIdx, endIdx + 1);
      } else {
        s = s.substring(startIdx);
      }
    }

    // 2. Fix unescaped newlines, tabs, and carriage returns inside string values:
    let insideString = false;
    let stringChar = '"';
    let escaped = false;
    let repaired = '';
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      if ((char === '"' || char === "'") && !escaped) {
        if (!insideString) {
          insideString = true;
          stringChar = char;
          repaired += char;
        } else if (char === stringChar) {
          insideString = false;
          repaired += char;
        } else {
          repaired += char;
        }
      } else if (char === '\\' && insideString) {
        escaped = !escaped;
        repaired += char;
      } else {
        if (insideString) {
          if (char === '\n') {
            repaired += '\\n';
          } else if (char === '\r') {
            repaired += '\\r';
          } else if (char === '\t') {
            repaired += '\\t';
          } else {
            repaired += char;
          }
        } else {
          repaired += char;
        }
        escaped = false;
      }
    }
    s = repaired;

    // 3. Balance braces and brackets if they are unbalanced (e.g. truncated response)
    let openBraces = 0;
    let openBrackets = 0;
    let inStr = false;
    let esc = false;
    let strCh = '"';
    
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      if (char === '\\' && inStr) {
        esc = !esc;
        continue;
      }
      if ((char === '"' || char === "'") && !esc) {
        if (!inStr) {
          inStr = true;
          strCh = char;
        } else if (char === strCh) {
          inStr = false;
        }
      }
      esc = false;
      
      if (!inStr) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces = Math.max(0, openBraces - 1);
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets = Math.max(0, openBrackets - 1);
      }
    }
    
    // Close strings if left open
    if (inStr) {
      s += strCh;
    }
    
    // Append missing brackets
    while (openBrackets > 0) {
      s += ']';
      openBrackets--;
    }
    
    // Append missing braces
    while (openBraces > 0) {
      s += '}';
      openBraces--;
    }

    // 4. Remove trailing commas before closing braces/brackets
    s = s.replace(/,\s*([\]}])/g, '$1');

    return s;
  }

  /**
   * Fix Mermaid syntax errors and ensure valid diagram format
   */
  private fixMermaidSyntax(diagram: string): string {
    if (!diagram) return "";
    
    // Decode HTML entities
    let fixed = diagram
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    // Remove markdown code blocks
    fixed = fixed.replace(/```mermaid\s*/g, '').replace(/```/g, '').trim();

    // Check diagram type
    const isSequence = fixed.match(/^sequenceDiagram/m) || fixed.includes('sequenceDiagram');
    const isClass = fixed.match(/^classDiagram/m) || fixed.includes('classDiagram');

    // If no diagram type found, return empty to avoid syntax errors
    if (!isSequence && !isClass) {
      console.warn('⚠️ Invalid Mermaid diagram: No diagram type found');
      return "";
    }

    // Clean up common syntax issues
    let lines = fixed
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length < 2) {
      console.warn('⚠️ Invalid Mermaid diagram: Too few lines');
      return "";
    }

    // Ensure diagram type is on first line
    if (!lines[0].match(/^(sequenceDiagram|classDiagram)/)) {
      const startIndex = lines.findIndex(line => line.match(/^(sequenceDiagram|classDiagram)/));
      if (startIndex !== -1) {
        lines = lines.slice(startIndex);
      } else {
        console.warn('⚠️ Invalid Mermaid diagram: Missing diagram type on first line');
        return "";
      }
    }

    // Process specific diagram rules
    if (isClass) {
      lines = lines.map(line => {
        // 1. Fix python-like class definition: class ClassName(BaseClass) -> class ClassName
        line = line.replace(/class\s+([a-zA-Z0-9_-]+)\([^)]*\)/g, 'class $1');

        // 2. Fix generic brackets inside classes/methods: List<String> -> List~String~
        line = line.replace(/([a-zA-Z0-9_]+)<([a-zA-Z0-9_]+)>/g, '$1~$2~');

        // 3. Fix dots in identifiers (e.g. nn.Module -> nn_Module) to avoid parser errors
        line = line.replace(/([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)/g, '$1_$2');

        // 4. Fix sequence-like arrows in class diagrams (e.g. A -> B or A ---> B to A --> B)
        if (line.includes('->') && !line.includes('--|>') && !line.includes('..|>')) {
          line = line.replace(/\s+-+>\s+/, ' --> ');
        }
        
        // 5. Fix shorthand inheritance arrow: A -|> B -> A --|> B
        if (line.includes('-|>') && !line.includes('--|>')) {
          line = line.replace(/\s+-\|>\s+/, ' --|> ');
        }

        return line;
      });
    }

    return lines.join('\n');
  }

  /**
   * Analyze repository with basic mode
   */
  private async analyzeRepoBasic(
    repoName: string,
    structure: string[],
    files: FileContent[]
  ): Promise<AnalysisResult> {
    const fileContext = files.map(f => `--- FILE: ${f.path} ---\n${f.content}\n`).join('\n');
    const structureContext = structure.join('\n');

    const prompt = `You are a Senior Software Architect. Analyze this GitHub repository.
Repository Name: ${repoName}
Structure:
${structureContext}
Files:
${fileContext}

Task: Generate a comprehensive architecture report.
1. SUMMARY: What does it do?
2. TECH STACK: Languages/Tools.
3. COMPONENTS: Key modules.
4. INSTALLATION: Detailed step-by-step setup guide. Use Markdown for formatting (headers, code blocks for commands). Separate Prerequisites, Installation, and Usage.
5. DIAGRAMS: Generate 2 valid Mermaid.js diagrams with CORRECT syntax.
   a. Class Diagram: Must start with "classDiagram" on first line. Use proper syntax: "class ClassName", relationships with arrows (--|>, -->, ..|>, etc.)
   b. Sequence Diagram: Must start with "sequenceDiagram" on first line. Use proper syntax: "participant Name", arrows (->, -->>, ->>), proper activation/deactivation.
   
   CRITICAL: Diagrams must be valid Mermaid syntax. No markdown code blocks. No extra text. Just pure Mermaid code.
   
6. SECURITY: General posture.
7. VULNERABILITIES: Potential risks (High/Medium/Low).

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "summary": "string",
  "techStack": ["string"],
  "keyComponents": ["string"],
  "installation": "string (markdown formatted)",
  "notes": "string",
  "classDiagram": "classDiagram\\nclass Example\\nExample : +method()\\n...",
  "sequenceDiagram": "sequenceDiagram\\nparticipant A\\nA->>B: Message\\n...",
  "securityProfile": "string",
  "vulnerabilities": [
    {
      "title": "string",
      "severity": "High|Medium|Low",
      "description": "string"
    }
  ]
}

CRITICAL: Inside all JSON string values (such as summary, installation, notes, description), DO NOT use unescaped double quotes ("). If you need to use quotes inside a string, use single quotes (') instead. Ensure all string properties are properly closed and valid JSON string values.`;

    const response = await this.callGemini(prompt, 8000, 'json');
    const parsed = this.parseGeminiResponse<AnalysisResult>(response);
    
    if (parsed.classDiagram) parsed.classDiagram = this.fixMermaidSyntax(parsed.classDiagram);
    if (parsed.sequenceDiagram) parsed.sequenceDiagram = this.fixMermaidSyntax(parsed.sequenceDiagram);
    
    return parsed;
  }

  /**
   * Analyze repository with archaeologist mode
   */
  private async analyzeRepoArchaeologist(
    repoName: string,
    structure: string[],
    files: FileContent[]
  ): Promise<AnalysisResult> {
    const fileContext = files.map(f => `--- FILE: ${f.path} ---\n${f.content}\n`).join('\n');
    const structureContext = structure.join('\n');

    const prompt = `You are an Expert Legacy Code Archaeologist.
Analyze legacy codebase ("${repoName}") for modernization.

Repository Structure:
${structureContext}

Source Code Contents:
${fileContext}

Objectives:

1. **Business Logic Extraction**: Plain English explanation.
2. **Coupling Analysis**: Identify "God Objects", spaghetti code.
3. **Visual Mapping**: Generate 2 valid Mermaid.js diagrams with CORRECT syntax.
    a. Class Diagram: Must start with "classDiagram" on first line. Show core legacy classes, inheritance, relationships.
    b. Sequence Diagram: Must start with "sequenceDiagram" on first line. Show a critical transaction flow.
    
    CRITICAL: Diagrams must be valid Mermaid syntax. No markdown code blocks. No extra text. Just pure Mermaid code.
    
4. **Microservices Refactoring Strategy**: Distinct domains to extract.
5. **Safety Net Generation**: Unit tests for fragile files.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "summary": "string",
  "techStack": ["string"],
  "keyComponents": ["string"],
  "installation": "string",
  "notes": "string",
  "classDiagram": "classDiagram\\nclass LegacyClass\\nLegacyClass : +method()\\n...",
  "sequenceDiagram": "sequenceDiagram\\nparticipant User\\nUser->>System: Request\\n...",
  "securityProfile": "string",
  "vulnerabilities": [
    {
      "title": "string",
      "severity": "High|Medium|Low",
      "description": "string"
    }
  ],
  "refactoringSuggestions": [
    {
      "title": "string",
      "currentModule": "string",
      "proposedMicroservice": "string",
      "reasoning": "string",
      "migrationSteps": ["string"]
    }
  ],
  "legacyUnitTests": [
    {
      "targetFile": "string",
      "description": "string",
      "code": "string"
    }
  ]
}

CRITICAL: Inside all JSON string values (such as summary, installation, notes, description, reasoning, code), DO NOT use unescaped double quotes ("). If you need to use quotes inside a string, use single quotes (') instead. Ensure all string properties are properly closed and valid JSON string values.`;

    const response = await this.callGemini(prompt, 8000, 'json');
    const parsed = this.parseGeminiResponse<AnalysisResult>(response);
    
    if (parsed.classDiagram) parsed.classDiagram = this.fixMermaidSyntax(parsed.classDiagram);
    if (parsed.sequenceDiagram) parsed.sequenceDiagram = this.fixMermaidSyntax(parsed.sequenceDiagram);

    return parsed;
  }

  /**
   * Main analysis function
   */
  async analyzeRepoWithGemini(
    repoName: string,
    structure: string[],
    files: FileContent[],
    mode: AnalysisMode
  ): Promise<AnalysisResult> {
    if (mode === 'archaeologist') {
      return this.analyzeRepoArchaeologist(repoName, structure, files);
    } else {
      return this.analyzeRepoBasic(repoName, structure, files);
    }
  }

  /**
   * Analyze single file
   */
  async analyzeSingleFile(
    fileName: string,
    content: string
  ): Promise<FileAnalysisResult> {
    const prompt = `Analyze this specific source code file.
File Name: ${fileName}
Content:
${content.slice(0, 30000)}

Provide:
1. A concise summary (what does this file do?).
2. Complexity assessment (Low/Medium/High).
3. List of external Dependencies (libraries or other files it imports).
4. Key Exports (functions, classes, or interfaces it provides to the system).
5. Potential Usage (briefly explain where/how this file might be used in a larger system).

Return ONLY valid JSON in this format:
{
  "summary": "string",
  "complexity": "Low|Medium|High",
  "dependencies": ["string"],
  "keyExports": ["string"],
  "potentialUsage": "string"
}

CRITICAL: Inside all JSON string values (such as summary, potentialUsage), DO NOT use unescaped double quotes ("). If you need to use quotes inside a string, use single quotes (') instead. Ensure all string properties are properly closed and valid JSON string values.`;

    const response = await this.callGemini(prompt, 4000, 'json');
    return this.parseGeminiResponse<FileAnalysisResult>(response);
  }

  /**
   * Create chat context for repository
   */
  async createRepoChat(
    repoName: string,
    analysis: AnalysisResult,
    files: FileContent[],
    structure: string[]
  ) {
    const filesContext = files.map(f => `\n--- START FILE: ${f.path} ---\n${f.content}\n--- END FILE: ${f.path} ---\n`).join('\n');

    const systemContext = `You are an expert AI software architect assistant for the GitHub repository "${repoName}".

You have access to the following context about the project:

1. **Architecture Analysis**:
${JSON.stringify(analysis, null, 2)}

2. **Repository Structure** (Key files):
${structure.slice(0, 200).join('\n')}

3. **Source Code** (Loaded files):
${filesContext}

Your goal is to answer user questions about this specific repository.
- Explain how specific features work based on the code.
- Suggest improvements or explain design patterns used.
- If the user asks about a file not in the "Loaded files" but in the structure, explain that you can only see the file names for those.
- Be technical, concise, and helpful.
- Use Markdown for code snippets.`;

    return {
      sendMessage: async (userMessage: string): Promise<string> => {
        const prompt = `${systemContext}

User Question: ${userMessage}

Provide a helpful, technical answer based on the repository context above.`;

        const response = await this.callGemini(prompt, 1500);
        return response;
      }
    };
  }

  /**
   * Create repo context from files and structure
   */
  createRepoContext(repoName: string, structure: string[], files: FileContent[]): string {
    const fileContext = files.map(f => `--- FILE: ${f.path} ---\n${f.content}\n`).join('\n');
    const structureContext = structure.join('\n');
    return `Repository: ${repoName}\nStructure:\n${structureContext}\nFiles:\n${fileContext}`;
  }
}

// Export singleton instance
const geminiService = new GeminiService();
export const analyzeRepoWithGemini = geminiService.analyzeRepoWithGemini.bind(geminiService);
export const analyzeSingleFile = geminiService.analyzeSingleFile.bind(geminiService);
export const createRepoChat = geminiService.createRepoChat.bind(geminiService);
export const createRepoContext = geminiService.createRepoContext.bind(geminiService);
