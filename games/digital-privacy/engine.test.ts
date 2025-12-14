
import { describe, it, expect } from 'vitest';
import { analyzeCustomText } from './engine.js';

describe('Digital Privacy Engine', () => {
    it('should detect names in custom text', () => {
        const text = "Hi, I'm John Doe.";
        const result = analyzeCustomText(text);

        expect(result.sensitiveData.some(item => item.type === 'Name')).toBe(true);
        expect(result.riskScore).toBeGreaterThan(10);
    });

    it('should detect locations in custom text', () => {
        const text = "I live on 123 Main Street.";
        const result = analyzeCustomText(text);

        expect(result.sensitiveData.some(item => item.type === 'Location')).toBe(true);
        expect(result.inferences).toContain('Your physical address or location');
    });

    it('should detect medical info', () => {
        const text = "I have diabetes.";
        const result = analyzeCustomText(text);

        expect(result.sensitiveData.some(item => item.type === 'Health Info')).toBe(true);
        expect(result.riskScore).toBeGreaterThan(20);
    });

    it('should detect financial info', () => {
        const text = "I make $100,000 a year.";
        const result = analyzeCustomText(text);

        expect(result.sensitiveData.some(item => item.type === 'Financial')).toBe(true);
    });

    it('should provide safer version for sensitive text', () => {
        const text = "Hi, I'm John Doe and I have diabetes.";
        const result = analyzeCustomText(text);

        expect(result.saferVersion).not.toBe(text);
        expect(result.whySafer).toContain('sensitive data point');
    });

    it('should handle safe text correctly', () => {
        const text = "What is the capital of France?";
        const result = analyzeCustomText(text);

        expect(result.sensitiveData.length).toBe(0);
        expect(result.riskScore).toBe(10); // Base risk
        expect(result.saferVersion).toBe(text);
    });
});
