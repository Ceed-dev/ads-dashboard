import { Translate } from "@google-cloud/translate/build/src/v2";

let translateClient: Translate | null = null;

function getTranslateClient(): Translate {
  if (translateClient) return translateClient;

  const credentials = process.env.GOOGLE_TRANSLATION_CREDENTIALS;

  if (credentials) {
    try {
      const parsed = JSON.parse(credentials);
      translateClient = new Translate({
        projectId: parsed.project_id,
        credentials: parsed,
      });
    } catch {
      // If JSON parsing fails, assume it's a path to credentials file
      translateClient = new Translate({
        keyFilename: credentials,
      });
    }
  } else {
    // Use default credentials (ADC)
    translateClient = new Translate();
  }

  return translateClient;
}

/**
 * Translate Japanese text to English
 * Uses Google Cloud Translation API
 */
export async function translateToEnglish(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    const client = getTranslateClient();
    const [translation] = await client.translate(text, {
      from: "ja",
      to: "en",
    });

    return translation;
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Batch translate multiple texts
 */
export async function translateTextsToEnglish(texts: string[]): Promise<string[]> {
  if (!texts || texts.length === 0) {
    return texts;
  }

  try {
    const client = getTranslateClient();
    const [translations] = await client.translate(texts, {
      from: "ja",
      to: "en",
    });

    return Array.isArray(translations) ? translations : [translations];
  } catch (error) {
    console.error("Batch translation error:", error);
    return texts;
  }
}
