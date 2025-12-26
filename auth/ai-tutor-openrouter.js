/**
 * AI Tutor - OpenRouter Integration
 *
 * Handles API calls to OpenRouter (unified LLM API proxy)
 * Supports Claude and other models through a single interface.
 */

import { formatConversationHistory, parseAIResponse } from './ai-tutor.js';

/**
 * Configuration for OpenRouter API
 */
const OPENROUTER_CONFIG = {
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3.5-sonnet',
    // API key should be stored in environment or loaded from config
    apiKey: null
};

/**
 * Set the OpenRouter API key
 * Call this once at application startup
 *
 * @param {string} apiKey - OpenRouter API key
 */
export function setOpenRouterKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        throw new Error('Invalid API key');
    }
    OPENROUTER_CONFIG.apiKey = apiKey;
}

/**
 * Get the currently configured API key (masked for security)
 *
 * @returns {string} Masked API key or warning message
 */
export function getOpenRouterKeyStatus() {
    if (!OPENROUTER_CONFIG.apiKey) {
        return '❌ Not configured';
    }
    const masked = OPENROUTER_CONFIG.apiKey.slice(0, 10) + '****';
    return `✅ Configured (${masked})`;
}

/**
 * Call OpenRouter API with a tutoring message
 *
 * @param {array} messages - Conversation history array with role/content
 * @param {string} systemPrompt - System prompt for the tutor
 * @param {object} options - Additional options
 * @returns {Promise<string>} AI response text
 * @throws {Error} If API call fails
 */
export async function callOpenRouter(messages, systemPrompt, options = {}) {
    if (!OPENROUTER_CONFIG.apiKey) {
        throw new Error('OpenRouter API key not configured. Call setOpenRouterKey() first.');
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Messages array is required and must not be empty');
    }

    if (!systemPrompt || typeof systemPrompt !== 'string') {
        throw new Error('System prompt is required');
    }

    // Format messages for OpenRouter
    const formattedMessages = formatConversationHistory(messages);

    // Build request body
    const requestBody = {
        model: options.model || OPENROUTER_CONFIG.model,
        messages: formattedMessages,
        system: systemPrompt,
        temperature: options.temperature ?? 0.7, // Balanced creativity/consistency
        max_tokens: options.maxTokens ?? 1024,
        top_p: options.topP ?? 0.95
    };

    try {
        const response = await fetch(`${OPENROUTER_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Learning Platform'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
            throw new Error(`OpenRouter API error: ${errorMsg}`);
        }

        const data = await response.json();

        // Extract response text
        const responseText = data.choices?.[0]?.message?.content;
        if (!responseText) {
            throw new Error('Invalid response format from OpenRouter');
        }

        // Parse and validate response
        const parseResult = parseAIResponse(responseText);
        if (!parseResult.isValid) {
            throw new Error(parseResult.error);
        }

        return parseResult.content;
    } catch (error) {
        console.error('OpenRouter API error:', error);
        throw new Error(`Failed to get response from AI: ${error.message}`);
    }
}

/**
 * Stream response from OpenRouter (for real-time display)
 *
 * @param {array} messages - Conversation history
 * @param {string} systemPrompt - System prompt
 * @param {function} onChunk - Callback for each chunk of text
 * @param {object} options - Additional options
 * @returns {Promise<string>} Complete response text
 */
export async function streamOpenRouter(messages, systemPrompt, onChunk, options = {}) {
    if (!OPENROUTER_CONFIG.apiKey) {
        throw new Error('OpenRouter API key not configured');
    }

    if (typeof onChunk !== 'function') {
        throw new Error('onChunk callback is required for streaming');
    }

    const formattedMessages = formatConversationHistory(messages);

    const requestBody = {
        model: options.model || OPENROUTER_CONFIG.model,
        messages: formattedMessages,
        system: systemPrompt,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
        stream: true
    };

    try {
        const response = await fetch(`${OPENROUTER_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Learning Platform'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to get response`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line || !line.startsWith('data: ')) continue;

                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) {
                        fullResponse += content;
                        onChunk(content);
                    }
                } catch (e) {
                    // Skip invalid JSON lines
                }
            }
        }

        return fullResponse;
    } catch (error) {
        console.error('OpenRouter streaming error:', error);
        throw new Error(`Streaming failed: ${error.message}`);
    }
}

/**
 * Get available models from OpenRouter
 * Useful for model selection UI
 *
 * @returns {Promise<array>} List of available models
 */
export async function getAvailableModels() {
    try {
        const response = await fetch(`${OPENROUTER_CONFIG.baseURL}/models`, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
}

/**
 * Check if API key is valid by making a minimal request
 *
 * @returns {Promise<boolean>} True if API key is valid
 */
export async function validateApiKey() {
    if (!OPENROUTER_CONFIG.apiKey) {
        return false;
    }

    try {
        const response = await fetch(`${OPENROUTER_CONFIG.baseURL}/models`, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('API key validation failed:', error);
        return false;
    }
}

/**
 * Get usage and cost information for debugging
 * (Some models provide this in response headers)
 *
 * @returns {object} Configuration and status info
 */
export function getConfigInfo() {
    return {
        baseURL: OPENROUTER_CONFIG.baseURL,
        model: OPENROUTER_CONFIG.model,
        apiKeyConfigured: !!OPENROUTER_CONFIG.apiKey,
        status: getOpenRouterKeyStatus()
    };
}
