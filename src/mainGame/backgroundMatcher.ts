/**
 * AI Background Matcher Service
 * 
 * Uses OpenAI to match user's abstract prompt to the best background image.
 * 
 * SETUP:
 * 1. Create a .env file in the project root (UofTHacks/)
 * 2. Add: VITE_OPENAI_API_KEY=your_api_key_here
 * 3. Restart the dev server after adding the key
 */

import { backgrounds, defaultBackground, type BackgroundImage } from './backgroundConfig';

// Re-export the type for other files to use
export type { BackgroundImage } from './backgroundConfig';

// Get API key from environment variable
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Matches user input to the best background using OpenAI
 */
export async function matchBackground(userInput: string): Promise<BackgroundImage> {
    // If no input provided, return default
    if (!userInput || userInput.trim() === '') {
        console.log('No user input, using default background');
        return defaultBackground;
    }

    // If no API key, fall back to keyword matching
    if (!OPENAI_API_KEY) {
        console.warn('No OpenAI API key found. Using keyword matching fallback.');
        console.warn('Add VITE_OPENAI_API_KEY to your .env file for AI matching.');
        return keywordMatch(userInput);
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a background scene matcher for a game. Given a user's description (which may be abstract, emotional, or reference places/things), pick the BEST matching background scene.

Think about:
- What mood or feeling does the user want?
- What places or things are they referencing?
- What visual elements would match their description?

Respond with ONLY the background ID (e.g., "bg12"), nothing else.`
                    },
                    {
                        role: 'user',
                        content: `User wants: "${userInput}"

Available background scenes:
${backgrounds.map(bg => `- ${bg.id}: ${bg.filename.replace(/_/g, ' ').replace('.png', '')} (tags: ${bg.tags.join(', ')})`).join('\n')}

Examples of how to match:
- "I like Toronto" or "big city vibes" → bg12 (city night skyline)
- "somewhere peaceful" or "chill place" → bg4 (ocean sunset beach) or bg8 (autumn park)
- "I want magic" or "fairy tale" → bg6 (magical castle) or bg13 (enchanted garden)
- "outer space" or "cosmic adventure" → bg7 (space nebula)
- "tropical vacation" → bg16 (tropical jungle)

Which background ID best matches "${userInput}"?`
                    }
                ],
                temperature: 0.3,
                max_tokens: 10,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const matchedId = data.choices[0]?.message?.content?.trim();

        // Find the matched background
        const matched = backgrounds.find(bg => bg.id === matchedId);

        if (matched) {
            console.log(`AI matched "${userInput}" to ${matched.id} (${matched.filename})`);
            return matched;
        } else {
            console.warn(`AI returned unknown ID: ${matchedId}, using keyword fallback`);
            return keywordMatch(userInput);
        }

    } catch (error) {
        console.error('AI matching failed, using keyword fallback:', error);
        return keywordMatch(userInput);
    }
}

/**
 * Fallback: Improved keyword matching when AI is unavailable
 */
function keywordMatch(userInput: string): BackgroundImage {
    const inputLower = userInput.toLowerCase();
    const words = inputLower.split(/\s+/);

    let bestMatch = defaultBackground;
    let bestScore = 0;

    for (const bg of backgrounds) {
        let score = 0;

        for (const tag of bg.tags) {
            const tagLower = tag.toLowerCase();

            // Exact word match in input (highest priority)
            for (const word of words) {
                if (word === tagLower) {
                    score += 10; // Exact match is very strong
                } else if (word.length > 3 && tagLower.includes(word)) {
                    score += 3; // Word is substring of tag
                } else if (tagLower.length > 3 && word.includes(tagLower)) {
                    score += 3; // Tag is substring of word
                }
            }

            // Full phrase contains tag
            if (inputLower.includes(tagLower) && tagLower.length > 3) {
                score += 5;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = bg;
        }
    }

    console.log(`Keyword matched "${userInput}" to ${bestMatch.id} (${bestMatch.filename}) with score ${bestScore}`);
    return bestMatch;
}

/**
 * Get the import path for a background image
 */
export function getBackgroundPath(background: BackgroundImage): string {
    return `/src/assets/backgrounds/${background.filename}`;
}
