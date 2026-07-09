import { CRMLead } from '../types/csv';
import { logger } from '../utils/logger';

export class AIService {
  /**
   * Processes a batch of raw records.
   * Currently maps them to standard CRM fields using intelligent key matching rules.
   * This is a placeholder for actual LLM-based extraction.
   */
  public async extractCRMLeads(rawRows: Record<string, string>[]): Promise<CRMLead[]> {
    logger.info(`AI Service: Processing batch of ${rawRows.length} records (placeholder mapping)...`);

    // In a real application, this is where we build the prompt, call OpenAI or Gemini,
    // and parse the structured output. Let's write the mapping rules.
    const mappedLeads: CRMLead[] = [];

    for (const row of rawRows) {
      const mapped = this.heuristicMap(row);
      mappedLeads.push(mapped);
    }

    // Simulate small latency to represent network delay of LLM calls
    await new Promise((resolve) => setTimeout(resolve, 300));

    return mappedLeads;
  }

  /**
   * Intelligent heuristic mapper to match keys from raw CSV row to standard CRM fields.
   */
  private heuristicMap(row: Record<string, string>): CRMLead {
    const keys = Object.keys(row);
    
    // Normalize keys to lowercase, alphanumeric-only for better matching
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

    // Extract first name and last name to combine if needed
    const firstName = findValue(['first name', 'firstname', 'fname']);
    const lastName = findValue(['last name', 'lastname', 'lname']);
    let name = findValue(['name', 'fullname', 'full name', 'lead name', 'contact name']);
    if (!name && firstName) {
      name = lastName ? `${firstName} ${lastName}` : firstName;
    }

    // Clean phone numbers: extract country code and number
    const rawPhone = findValue(['mobile', 'phone', 'mobile number', 'phone number', 'telephone', 'contact']);
    let countryCode = findValue(['country_code', 'dial_code', 'country code', 'dial code', 'code']);
    let mobileWithoutCountryCode = rawPhone;

    if (rawPhone && !countryCode) {
      // Very simple parsing: if phone starts with +, try to split
      if (rawPhone.startsWith('+')) {
        const matches = rawPhone.match(/^\+(\d{1,3})\s*(.*)$/);
        if (matches) {
          countryCode = '+' + matches[1];
          mobileWithoutCountryCode = matches[2].replace(/[^0-9]/g, '');
        }
      }
    }

    return {
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
    };
  }
}

export const aiService = new AIService();
export default aiService;
