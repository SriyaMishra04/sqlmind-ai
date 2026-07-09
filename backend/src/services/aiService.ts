import OpenAI from 'openai';
import { CRMLead } from '../types/csv';
import { logger } from '../utils/logger';
import { EXTRACTION_SYSTEM_PROMPT, getExtractionUserPrompt } from '../prompt/extractionPrompt';

export class AIService {
  private client: OpenAI | null = null;
  private provider: 'openai' | 'gemini' | 'heuristic' = 'heuristic';
  private model: string = '';

  constructor() {
    this.initializeClient();
  }

  /**
   * Initializes the OpenAI SDK client based on env parameters.
   */
  private initializeClient() {
    const provider = (process.env.LLM_PROVIDER || 'heuristic').toLowerCase();
    const model = process.env.LLM_MODEL || '';
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    try {
      if (
        provider === 'openai' && 
        openaiKey && 
        openaiKey !== 'your-openai-api-key-here' && 
        openaiKey.trim() !== ''
      ) {
        this.client = new OpenAI({ apiKey: openaiKey });
        this.provider = 'openai';
        this.model = model || 'gpt-4o-mini';
        logger.info(`AI Service: Initialized OpenAI client using model: ${this.model}`);
      } else if (
        provider === 'gemini' && 
        geminiKey && 
        geminiKey !== 'your-gemini-api-key-here' && 
        geminiKey.trim() !== ''
      ) {
        // Use Gemini OpenAI-compatible API
        this.client = new OpenAI({
          apiKey: geminiKey,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
        });
        this.provider = 'gemini';
        this.model = model || 'gemini-1.5-flash';
        logger.info(`AI Service: Initialized Gemini compatibility endpoint using model: ${this.model}`);
      } else {
        logger.warn(`AI Service: No active keys found for '${provider}'. Falling back to Local Heuristic Mapping Mode.`);
        this.provider = 'heuristic';
      }
    } catch (err: any) {
      logger.error(`AI Service: Failed to initialize client: ${err.message}. Falling back to Heuristic Mode.`);
      this.provider = 'heuristic';
    }
  }

  /**
   * Processes a batch of raw records.
   * Calls OpenAI/Gemini JSON mode, falling back to heuristic parsing if it fails.
   */
  public async extractCRMLeads(rawRows: Record<string, string>[]): Promise<CRMLead[]> {
    // Re-verify client just in case env configuration refreshed
    if (!this.client || this.provider === 'heuristic') {
      return this.heuristicFallback(rawRows);
    }

    try {
      logger.info(`AI Service: Querying LLM (${this.provider}/${this.model}) for ${rawRows.length} records...`);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: getExtractionUserPrompt(rawRows) }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('LLM returned an empty completion content.');
      }

      logger.debug(`AI Service: Completion content received`, { content });

      const parsedResult = JSON.parse(content);
      
      // Look for the "leads" key or standard arrays
      let leads: CRMLead[] = [];
      if (parsedResult && Array.isArray(parsedResult.leads)) {
        leads = parsedResult.leads;
      } else if (Array.isArray(parsedResult)) {
        leads = parsedResult;
      } else {
        throw new Error("Invalid JSON structure: Output does not contain a 'leads' array.");
      }

      logger.info(`AI Service: Successfully parsed ${leads.length} leads from LLM completion`);
      return leads;
    } catch (error: any) {
      logger.error(`AI Service: LLM extraction query failed: ${error.message}. Running heuristic fallback.`, error);
      return this.heuristicFallback(rawRows);
    }
  }

  /**
   * Local Heuristic Mapper fallback to align keys from raw CSV row to standard CRM fields.
   */
  private heuristicFallback(rawRows: Record<string, string>[]): CRMLead[] {
    logger.info(`AI Service: Running local heuristic mapping fallback for ${rawRows.length} rows...`);
    
    const mappedLeads: CRMLead[] = [];

    for (const row of rawRows) {
      const keys = Object.keys(row);
      
      const findValue = (synonyms: string[]): string | undefined => {
        for (const syn of synonyms) {
          const matchingKey = keys.find(k => {
            const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normKey === normSyn || normKey.includes(normSyn) || normSyn.includes(normKey);
          });
          if (matchingKey && row[matchingKey]) {
            return row[matchingKey].trim();
          }
        }
        return undefined;
      };

      const firstName = findValue(['first name', 'firstname', 'fname']);
      const lastName = findValue(['last name', 'lastname', 'lname']);
      let name = findValue(['name', 'fullname', 'full name', 'lead name', 'contact name']);
      if (!name && firstName) {
        name = lastName ? `${firstName} ${lastName}` : firstName;
      }

      const rawPhone = findValue(['mobile', 'phone', 'mobile number', 'phone number', 'telephone', 'contact']);
      let countryCode = findValue(['country_code', 'dial_code', 'country code', 'dial code', 'code']);
      let mobileWithoutCountryCode = rawPhone;

      if (rawPhone && !countryCode) {
        if (rawPhone.startsWith('+')) {
          const matches = rawPhone.match(/^\+(\d{1,3})\s*(.*)$/);
          if (matches) {
            countryCode = '+' + matches[1];
            mobileWithoutCountryCode = matches[2].replace(/[^0-9]/g, '');
          }
        }
      }

      mappedLeads.push({
        created_at: findValue(['created_at', 'created date', 'date', 'time']) || new Date().toISOString(),
        name: name || 'Unknown Lead',
        email: findValue(['email', 'email address', 'mail', 'e-mail']) || '',
        country_code: countryCode || '',
        mobile_without_country_code: mobileWithoutCountryCode || rawPhone || '',
        company: findValue(['company', 'organization', 'firm', 'employer', 'work']) || '',
        city: findValue(['city', 'town', 'location']) || '',
        state: findValue(['state', 'province', 'region']) || '',
        country: findValue(['country', 'nation']) || '',
        lead_owner: findValue(['lead_owner', 'owner', 'assigned to', 'agent']) || 'Unassigned',
        crm_status: findValue(['crm_status', 'status', 'stage', 'lead status']) || 'New',
        crm_note: findValue(['crm_note', 'note', 'notes', 'comments', 'comment']) || '',
        data_source: findValue(['data_source', 'source', 'lead source', 'channel']) || 'CSV Import',
        possession_time: findValue(['possession_time', 'possession', 'duration']) || '',
        description: findValue(['description', 'desc', 'about', 'details', 'summary']) || ''
      });
    }

    return mappedLeads;
  }
}

export const aiService = new AIService();
export default aiService;
