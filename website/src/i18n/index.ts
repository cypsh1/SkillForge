import zh from './zh.json';
import en from './en.json';

const messages: Record<string, typeof zh> = { zh, en };

export function getLocaleFromUrl(url: URL): string {
  const [, , locale] = url.pathname.split('/');
  return locale && locale in messages ? locale : 'zh';
}

export function t(locale: string): typeof zh {
  return messages[locale] || messages.zh;
}

export function getAlternateLocale(locale: string): string {
  return locale === 'zh' ? 'en' : 'zh';
}

export function getAlternateLabel(locale: string): string {
  return locale === 'zh' ? 'EN' : '中文';
}
