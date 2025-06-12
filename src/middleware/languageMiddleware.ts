import { Request, Response, NextFunction } from 'express';

// Define supported languages and a fallback language
const supportedLanguages = ['en', 'vi'];
const fallbackLanguage = 'en';

// Extend the Request type to include a 'lang' property
declare global {
  namespace Express {
    interface Request {
      lang?: string; // Add the lang property
    }
  }
}

export const detectLanguage = (req: Request, res: Response, next: NextFunction) => {
  let lang = fallbackLanguage;
  // Check Accept-Language header
  const acceptLanguageHeader = req.headers['accept-language'];
  if (acceptLanguageHeader) {
    const acceptedLanguages = acceptLanguageHeader.split(',').map(l => l.split(';')[0].trim().toLowerCase());
    for (const clientLang of acceptedLanguages) {
      if (supportedLanguages.includes(clientLang)) {
        lang = clientLang;
        break;
      }
    }
  }
  req.lang = lang;
  next();
}; 