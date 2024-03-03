import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import cz from './cz.json';
import sk from './sk.json';
import pl from './pl.json';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: en,
      },
      pl: {
        translation: pl,
      },
      sk: {
        translation: sk,
      },
      cz: {
        translation: cz,
      },
    },
    lng: 'cz', // if you're using a language detector, do not define the lng option
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
