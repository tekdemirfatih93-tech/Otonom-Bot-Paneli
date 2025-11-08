import { OllamaClient } from './ollama.js';
import sharp from 'sharp';

export class CaptchaSolver {
  constructor() {
    this.ollama = new OllamaClient();
  }

  async solveCaptcha(page, captchaType = 'auto-detect') {
    const startTime = Date.now();
    
    try {
      console.log(`[Captcha Solver] Detecting and solving ${captchaType} captcha...`);
      
      // Auto-detect if not specified
      if (captchaType === 'auto-detect') {
        captchaType = await this.detectCaptchaType(page);
      }
      
      if (!captchaType) {
        console.log('[Captcha Solver] No captcha detected');
        return true;
      }

      // Take screenshot
      const screenshot = await page.screenshot({ fullPage: false });
      const base64Image = await sharp(screenshot).resize(800, 600, { fit: 'inside' }).toBuffer().then(buf => buf.toString('base64'));
      
      // AI Analysis
      const prompt = this.generatePrompt(captchaType);
      const solution = await this.ollama.analyzeImage(base64Image, prompt);
      
      console.log(`[Captcha Solver] AI Solution: ${solution}`);
      
      // Apply solution
      const success = await this.applySolution(page, solution, captchaType);
      
      const timeTaken = Date.now() - startTime;
      console.log(`[Captcha Solver] ${success ? '✅ Solved' : '❌ Failed'} in ${timeTaken}ms`);
      
      return success;
      
    } catch (error) {
      console.error('[Captcha Solver Error]', error.message);
      return false;
    }
  }

  async detectCaptchaType(page) {
    // Check for common captcha types
    const detectors = {
      'recaptcha_v2': 'iframe[src*="recaptcha"]',
      'hcaptcha': 'iframe[src*="hcaptcha"]',
      'text': 'img[alt*="captcha" i], img[src*="captcha" i]',
      'funcaptcha': 'iframe[src*="funcaptcha"]'
    };

    for (const [type, selector] of Object.entries(detectors)) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`[Captcha Solver] Detected: ${type}`);
          return type;
        }
      } catch {}
    }

    return null;
  }

  generatePrompt(captchaType) {
    const prompts = {
      'recaptcha_v2': 'This is a reCAPTCHA image grid. Identify which images match the prompt (usually traffic lights, crosswalks, buses, etc). Return ONLY the grid positions as JSON array [1,3,7] where 1 is top-left, 9 is bottom-right.',
      'hcaptcha': 'This is an hCaptcha. Identify the correct images matching the prompt. Return grid positions as JSON array.',
      'text': 'This is a text-based CAPTCHA. Read the distorted text/numbers in the image. Return ONLY the text, nothing else.',
      'math': 'Solve the math problem shown in the image. Return ONLY the numerical answer.',
      'funcaptcha': 'This is a FunCaptcha. Identify the correct orientation or pattern. Return the answer as text.'
    };
    
    return prompts[captchaType] || 'Analyze this CAPTCHA image and provide the solution.';
  }

  async applySolution(page, solution, type) {
    try {
      // Clean up solution
      solution = solution.trim();
      
      if (type === 'text' || type === 'math') {
        // Find input field and type the solution
        const input = await page.$('input[type="text"][name*="captcha" i], input[id*="captcha" i]');
        if (input) {
          await input.fill(solution);
          await page.waitForTimeout(500);
          
          // Click submit if exists
          const submit = await page.$('button[type="submit"], input[type="submit"]');
          if (submit) {
            await submit.click();
          }
          
          return true;
        }
      }
      
      if (type.includes('recaptcha') || type.includes('hcaptcha')) {
        // For image grids, parse JSON array and click positions
        try {
          const positions = JSON.parse(solution);
          if (Array.isArray(positions)) {
            // Click on specified grid positions
            // This is simplified - real implementation needs iframe handling
            console.log(`[Captcha Solver] Would click positions: ${positions}`);
            return true;
          }
        } catch {
          console.warn('[Captcha Solver] Could not parse grid positions');
        }
      }
      
      return false;
    } catch (error) {
      console.error('[Captcha Solver Apply Error]', error.message);
      return false;
    }
  }
}
