import { en } from './locales/en';
import type { LocaleCode } from './locale-codes';
import type { LocaleMessages } from './locale-messages.types';

/**
 * The default locale bundle, statically imported so the app boots instantly
 * with working translations. All other locales are code-split and fetched on
 * demand via `localeLoaders`.
 */
export const defaultMessages: LocaleMessages = en;

/**
 * Lazy loaders for every supported locale. Each returns the locale's message
 * bundle; the underlying `import()` is code-split by the bundler so only the
 * active locale is shipped to the client.
 */
export const localeLoaders: Record<LocaleCode, () => Promise<LocaleMessages>> =
  {
    am: () => import('./locales/am').then((m) => m.am),
    ar: () => import('./locales/ar').then((m) => m.ar),
    az: () => import('./locales/az').then((m) => m.az),
    be: () => import('./locales/be').then((m) => m.be),
    bg: () => import('./locales/bg').then((m) => m.bg),
    bn: () => import('./locales/bn').then((m) => m.bn),
    bs: () => import('./locales/bs').then((m) => m.bs),
    ca: () => import('./locales/ca').then((m) => m.ca),
    cs: () => import('./locales/cs').then((m) => m.cs),
    cy: () => import('./locales/cy').then((m) => m.cy),
    da: () => import('./locales/da').then((m) => m.da),
    de: () => import('./locales/de').then((m) => m.de),
    el: () => import('./locales/el').then((m) => m.el),
    en: () => Promise.resolve(en),
    es: () => import('./locales/es').then((m) => m.es),
    et: () => import('./locales/et').then((m) => m.et),
    eu: () => import('./locales/eu').then((m) => m.eu),
    fa: () => import('./locales/fa').then((m) => m.fa),
    fi: () => import('./locales/fi').then((m) => m.fi),
    fr: () => import('./locales/fr').then((m) => m.fr),
    ga: () => import('./locales/ga').then((m) => m.ga),
    gd: () => import('./locales/gd').then((m) => m.gd),
    gl: () => import('./locales/gl').then((m) => m.gl),
    gu: () => import('./locales/gu').then((m) => m.gu),
    ha: () => import('./locales/ha').then((m) => m.ha),
    he: () => import('./locales/he').then((m) => m.he),
    hi: () => import('./locales/hi').then((m) => m.hi),
    hr: () => import('./locales/hr').then((m) => m.hr),
    hu: () => import('./locales/hu').then((m) => m.hu),
    id: () => import('./locales/id').then((m) => m.id),
    is: () => import('./locales/is').then((m) => m.is),
    it: () => import('./locales/it').then((m) => m.it),
    ja: () => import('./locales/ja').then((m) => m.ja),
    kk: () => import('./locales/kk').then((m) => m.kk),
    km: () => import('./locales/km').then((m) => m.km),
    ko: () => import('./locales/ko').then((m) => m.ko),
    lb: () => import('./locales/lb').then((m) => m.lb),
    lt: () => import('./locales/lt').then((m) => m.lt),
    lv: () => import('./locales/lv').then((m) => m.lv),
    mk: () => import('./locales/mk').then((m) => m.mk),
    mr: () => import('./locales/mr').then((m) => m.mr),
    ms: () => import('./locales/ms').then((m) => m.ms),
    mt: () => import('./locales/mt').then((m) => m.mt),
    my: () => import('./locales/my').then((m) => m.my),
    nb: () => import('./locales/nb').then((m) => m.nb),
    ne: () => import('./locales/ne').then((m) => m.ne),
    nl: () => import('./locales/nl').then((m) => m.nl),
    pa: () => import('./locales/pa').then((m) => m.pa),
    pl: () => import('./locales/pl').then((m) => m.pl),
    pt: () => import('./locales/pt').then((m) => m.pt),
    ro: () => import('./locales/ro').then((m) => m.ro),
    ru: () => import('./locales/ru').then((m) => m.ru),
    si: () => import('./locales/si').then((m) => m.si),
    sk: () => import('./locales/sk').then((m) => m.sk),
    sl: () => import('./locales/sl').then((m) => m.sl),
    sq: () => import('./locales/sq').then((m) => m.sq),
    sr: () => import('./locales/sr').then((m) => m.sr),
    sv: () => import('./locales/sv').then((m) => m.sv),
    sw: () => import('./locales/sw').then((m) => m.sw),
    ta: () => import('./locales/ta').then((m) => m.ta),
    te: () => import('./locales/te').then((m) => m.te),
    th: () => import('./locales/th').then((m) => m.th),
    tl: () => import('./locales/tl').then((m) => m.tl),
    tr: () => import('./locales/tr').then((m) => m.tr),
    uk: () => import('./locales/uk').then((m) => m.uk),
    ur: () => import('./locales/ur').then((m) => m.ur),
    uz: () => import('./locales/uz').then((m) => m.uz),
    vi: () => import('./locales/vi').then((m) => m.vi),
    yo: () => import('./locales/yo').then((m) => m.yo),
    zh: () => import('./locales/zh').then((m) => m.zh),
    zu: () => import('./locales/zu').then((m) => m.zu),
  };
