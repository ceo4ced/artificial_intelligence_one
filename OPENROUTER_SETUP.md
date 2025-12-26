# AI Tutor - OpenRouter Setup Guide

This guide explains how to set up and use the AI Tutor feature with OpenRouter.

## Quick Start (5 Minutes)

### 1. Get Your OpenRouter API Key

1. Visit https://openrouter.ai
2. Sign up for a free account (no credit card required for testing)
3. Go to Settings → API Keys
4. Copy your API key (looks like: `sk-or-...`)

### 2. Enable the AI Tutor

Choose one of these methods to provide your API key:

#### Method A: JavaScript Global Variable (Testing)
```html
<script>
  window.OPENROUTER_API_KEY = "your-key-here";
</script>

<!-- Then load the tutor modal -->
<script src="components/ai-tutor-modal.html"></script>
```

#### Method B: localStorage (Persistent Across Sessions)
```javascript
// Set once in browser console or in your code:
localStorage.setItem('openrouter_api_key', 'your-key-here');

// The AI Tutor will automatically detect it
```

#### Method C: sessionStorage (Current Session Only)
```javascript
// Set in browser console:
sessionStorage.setItem('openrouter_api_key', 'your-key-here');
```

### 3. Add to Lesson Pages

Add this single line to any lesson page where you want the tutor:

```html
<script src="../../components/ai-tutor-modal.html"></script>
```

That's it! The tutor will appear as a floating button (🤖) in the bottom right.

---

## How to Use the AI Tutor

1. **Click the 🤖 button** in the bottom right corner
2. **Type your question** about the lesson
3. **Press Enter** or click "Send"
4. **Wait for the AI response** (usually 2-5 seconds)
5. **Continue the conversation** by asking follow-up questions

### Buttons Explained

- **Send** - Send your question to the tutor
- **Save** - Download the conversation as a JSON file
- **Clear** - Delete all messages in the current conversation
- **History** - See stats about your conversation

---

## Features

✅ **Ask Questions** - Get instant tutoring help
✅ **Real-time Responses** - Claude 3.5 Sonnet powers the tutor
✅ **Conversation History** - See all your exchanges
✅ **Export Conversations** - Download as JSON for portfolios
✅ **Mobile Friendly** - Works on phones and tablets
✅ **Multiple Models** - Switch to GPT-4, Llama, or other models

---

## Advanced Configuration

### Change the AI Model

By default, the tutor uses Claude 3.5 Sonnet. To use a different model:

```javascript
// In your page, before loading the tutor:
window.OPENROUTER_MODEL = "openai/gpt-4o";

// Or other options:
// "openai/gpt-4-turbo" - GPT-4 Turbo
// "meta-llama/llama-2-70b-chat" - Open source
// "google/palm-2-chat-bison" - Google's PaLM
```

### Customize Tutor Behavior

```javascript
// Get the OpenRouter module
import { setOpenRouterKey } from '../../auth/ai-tutor-openrouter.js';

// Set API key programmatically
setOpenRouterKey('your-key-here');

// Call the tutor API directly
const response = await callOpenRouter(messages, systemPrompt, {
    temperature: 0.5,    // Lower = more focused, Higher = more creative
    maxTokens: 2048      // Max response length
});
```

---

## Pricing & Costs

OpenRouter is **pay-as-you-go**:

- **Claude 3.5 Sonnet**: ~$0.003 per 1,000 input tokens, $0.015 per 1,000 output tokens
- **Example**: A typical Q&A exchange = 1-2 cents
- **Free trial**: $5 free credits to start
- **No subscription required** - Only pay for what you use

### Cost Examples

- 100 student questions = ~$1-2
- Full school year per student = ~$20-30

---

## Troubleshooting

### "API Key Not Configured"

Make sure you set your API key before opening the tutor:

```javascript
// Add this to your page:
localStorage.setItem('openrouter_api_key', 'sk-or-...');

// Refresh the page
```

### "Error: Invalid API Key"

1. Check that your API key starts with `sk-or-`
2. Verify you copied it correctly from https://openrouter.ai
3. Make sure your OpenRouter account is active

### Responses are slow

- This is normal - Claude takes 2-5 seconds to respond
- Slower internet = longer waits
- Consider using a faster model like GPT-3.5 Turbo

### "CORS Error" or "Blocked Request"

OpenRouter handles CORS, but make sure:
1. Your site is publicly accessible
2. JavaScript modules are loading from the same origin
3. No ad blockers are blocking the API request

---

## Integration Examples

### Basic Example - Single Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Lesson</title>
</head>
<body>
    <h1>Neural Networks Lesson</h1>
    <p>Learn about neural networks...</p>

    <!-- Add the AI Tutor -->
    <script>
        localStorage.setItem('openrouter_api_key', 'sk-or-YOUR-KEY-HERE');
    </script>
    <script src="components/ai-tutor-modal.html"></script>
</body>
</html>
```

### Advanced Example - Multiple Lessons

```html
<script type="module">
    import { setOpenRouterKey } from './auth/ai-tutor-openrouter.js';

    // Set up once
    const apiKey = localStorage.getItem('openrouter_api_key');
    if (apiKey) {
        setOpenRouterKey(apiKey);
    }
</script>

<script src="components/ai-tutor-modal.html"></script>
```

---

## Security Considerations

⚠️ **Important**: Your API key is stored in the browser:

- ✅ **Safe for**: Educational environments, internal tools
- ⚠️ **Warning**: Don't expose your key in public GitHub repos
- 🔒 **Best practice**: Use environment variables for production

### Protecting Your API Key

```javascript
// ❌ DON'T do this - exposes key in browser
window.OPENROUTER_API_KEY = "sk-or-abc123...";

// ✅ DO this instead - load from secure backend
fetch('/api/get-tutor-key')
    .then(r => r.json())
    .then(data => {
        localStorage.setItem('openrouter_api_key', data.key);
    });
```

---

## API Reference

### Core Functions

#### `setOpenRouterKey(apiKey)`
Sets the OpenRouter API key for this session.

```javascript
import { setOpenRouterKey } from './auth/ai-tutor-openrouter.js';
setOpenRouterKey('sk-or-...');
```

#### `callOpenRouter(messages, systemPrompt, options)`
Calls the OpenRouter API and returns a response.

```javascript
const response = await callOpenRouter(
    [
        { role: 'user', content: 'What is AI?' },
        { role: 'assistant', content: 'AI is...' }
    ],
    'You are an AI tutor...',
    {
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.7,
        maxTokens: 1024
    }
);
```

#### `streamOpenRouter(messages, systemPrompt, onChunk, options)`
Streams responses from OpenRouter for real-time display.

```javascript
await streamOpenRouter(
    messages,
    systemPrompt,
    (chunk) => console.log(chunk), // Called for each text chunk
    { temperature: 0.7 }
);
```

---

## Support

For issues with OpenRouter:
- Visit https://openrouter.ai/docs
- Check API status at https://status.openrouter.ai

For issues with AI Tutor:
- Review VERSION.md for implementation details
- Check tests in `tests/ai-tutor.test.js`

---

## Next Steps

1. ✅ Set up your OpenRouter API key
2. ✅ Add the tutor to a lesson page
3. ✅ Test by asking a question
4. ✅ Share the tutor with students
5. ✅ Monitor costs on OpenRouter dashboard

Enjoy teaching with AI! 🤖
