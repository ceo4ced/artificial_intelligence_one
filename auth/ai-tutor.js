/**
 * AI Tutor Module - Pure Functions for AI Tutoring System
 *
 * Pure functions designed for testability. All side effects (API calls,
 * database operations) are separated and handled in wrapper functions.
 */

/**
 * Validates a student question for appropriate content
 * Pure function - no side effects
 *
 * @param {string} question - The student's question
 * @returns {object} { isValid: boolean, error?: string }
 */
export function validateQuestion(question) {
    if (!question || typeof question !== 'string') {
        return { isValid: false, error: 'Question must be a non-empty string' };
    }

    const trimmed = question.trim();
    if (trimmed.length < 3) {
        return { isValid: false, error: 'Question must be at least 3 characters' };
    }

    if (trimmed.length > 2000) {
        return { isValid: false, error: 'Question exceeds 2000 character limit' };
    }

    // Check for obviously inappropriate content
    const inappropriatePatterns = [
        /hack|exploit|crack|bypass/i,
        /bomb|violence|kill/i,
    ];

    for (const pattern of inappropriatePatterns) {
        if (pattern.test(trimmed)) {
            return { isValid: false, error: 'Question contains inappropriate content' };
        }
    }

    return { isValid: true };
}

/**
 * Builds a system prompt for the tutoring context
 * Pure function - creates consistent prompts
 *
 * @param {string} lessonTopic - Current lesson topic
 * @param {string} userRole - User's role (student, teacher, etc.)
 * @param {number} tierLevel - User's tier level (0-7)
 * @returns {string} System prompt for Claude
 */
export function buildSystemPrompt(lessonTopic = 'Artificial Intelligence', userRole = 'student', tierLevel = 2) {
    const gradeLevel = tierLevel === 2 ? 'high school/introductory' : 'advanced';

    return `You are an expert AI tutor for the course "${lessonTopic}".

Your role:
- Explain AI/ML concepts in a clear, engaging way
- Match explanations to ${gradeLevel} student level
- Ask clarifying questions if the student's question is unclear
- Provide hints instead of direct answers when helping with problems
- Encourage critical thinking
- Use real-world examples

Guidelines:
- Keep responses concise (2-3 paragraphs max)
- Use analogies to explain complex concepts
- Never solve homework directly - guide instead
- Be encouraging and supportive
- If unsure about academic accuracy, say so

Current user role: ${userRole}`;
}

/**
 * Formats a conversation history for the API
 * Pure function - transforms data structure
 *
 * @param {array} messages - Array of {role, content} message objects
 * @returns {array} Formatted messages for Claude API
 */
export function formatConversationHistory(messages) {
    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .filter(msg => msg && msg.role && msg.content)
        .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: String(msg.content).trim()
        }))
        .slice(-10); // Keep last 10 messages for context window
}

/**
 * Parses Claude's response for quality and safety
 * Pure function - validates response
 *
 * @param {string} response - Claude's raw response
 * @returns {object} { isValid: boolean, content: string, error?: string }
 */
export function parseAIResponse(response) {
    if (typeof response !== 'string') {
        return { isValid: false, content: '', error: 'Invalid response format' };
    }

    const content = response.trim();

    if (content.length === 0) {
        return { isValid: false, content: '', error: 'Empty response from AI' };
    }

    if (content.length > 5000) {
        return { isValid: false, content: '', error: 'Response too long' };
    }

    return { isValid: true, content };
}

/**
 * Creates a message object for storage
 * Pure function - formats data
 *
 * @param {string} content - Message content
 * @param {string} role - 'user' or 'assistant'
 * @param {number} timestamp - Unix timestamp (optional)
 * @returns {object} Formatted message
 */
export function createMessage(content, role = 'user', timestamp = null) {
    return {
        content: String(content).trim(),
        role: role === 'assistant' ? 'assistant' : 'user',
        timestamp: timestamp || Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
}

/**
 * Calculates conversation statistics
 * Pure function - analyzes conversation
 *
 * @param {array} messages - Array of message objects
 * @returns {object} Statistics about conversation
 */
export function getConversationStats(messages) {
    if (!Array.isArray(messages)) {
        return { totalMessages: 0, userMessages: 0, aiMessages: 0, avgLength: 0 };
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role === 'assistant');
    const avgLength = messages.length > 0
        ? messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / messages.length
        : 0;

    return {
        totalMessages: messages.length,
        userMessages: userMessages.length,
        aiMessages: aiMessages.length,
        avgLength: Math.round(avgLength)
    };
}

/**
 * Determines if conversation should be saved
 * Pure function - business logic
 *
 * @param {array} messages - Conversation messages
 * @returns {boolean} Whether to save conversation
 */
export function shouldSaveConversation(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return false;
    }
    // Save if there are at least 2 exchanges (question + answer)
    return messages.length >= 2;
}

/**
 * Builds a conversation title from initial question
 * Pure function - text processing
 *
 * @param {string} firstQuestion - The initial question
 * @returns {string} Conversation title
 */
export function generateConversationTitle(firstQuestion) {
    if (!firstQuestion || typeof firstQuestion !== 'string') {
        return 'Untitled Conversation';
    }

    const words = firstQuestion
        .trim()
        .split(/\s+/)
        .slice(0, 5)
        .join(' ');

    const title = words.length > 0 ? words : 'Untitled Conversation';
    return title.substring(0, 100);
}

/**
 * Checks if user is allowed to use AI Tutor based on tier
 * Pure function - permission check
 *
 * @param {number} tierLevel - User's tier level (0-7)
 * @param {string} role - User's role
 * @returns {object} { canUse: boolean, reason?: string }
 */
export function checkTutorAccess(tierLevel, role) {
    // Student tier and above can use tutor
    const TUTOR_MIN_TIER = 2; // STUDENT level

    if (tierLevel >= TUTOR_MIN_TIER) {
        return { canUse: true };
    }

    return {
        canUse: false,
        reason: 'AI Tutor requires student access level or higher'
    };
}

/**
 * Sanitizes user content to prevent prompt injection
 * Pure function - security
 *
 * @param {string} content - User content to sanitize
 * @returns {string} Sanitized content
 */
export function sanitizeContent(content) {
    if (typeof content !== 'string') {
        return '';
    }

    // Remove potential prompt injection patterns
    let sanitized = content
        .replace(/```[\s\S]*?```/g, '(code block removed)') // Remove code blocks
        .replace(/ignore.*instructions?/gi, 'note:') // Defang injection attempts
        .replace(/system.*prompt/gi, 'topic:');

    return sanitized.trim();
}
