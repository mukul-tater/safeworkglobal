import type { CountryInsight } from "../types";
import { buildCountryInsight, GCC_SECTORS, LISTING_BLURB } from "./shared";

const uae = buildCountryInsight({
  id: "uae",
  slug: "uae",
  flag: "🇦🇪",
  name: { en: "UAE", hi: "संयुक्त अरब अमीरात" },
  jobsQuery: "UAE",
  exploreCta: { en: "Explore UAE | UAE देखें", hi: "UAE देखें | Explore UAE" },
  detailReady: true,
  listingDescription: LISTING_BLURB,
  listingSectors: GCC_SECTORS,
  hero: {
    headline: { en: "Know Before You Go.", hi: "जाने से पहले जानें।" },
    subheading: {
      en: "Real information about work, wages, accommodation, lifestyle and working conditions for workers considering employment in the UAE.",
      hi: "UAE में रोजगार पर जाने से पहले काम, वेतन, रहने की व्यवस्था, जीवनशैली और working conditions के बारे में महत्वपूर्ण जानकारी जानें।",
    },
    philosophy: {
      en: "See the Opportunity. Understand the Reality.",
      hi: "अवसर देखें। वास्तविकता समझें।",
    },
  },
});

const saudi = buildCountryInsight({
  id: "saudi-arabia",
  slug: "saudi-arabia",
  flag: "🇸🇦",
  name: { en: "Saudi Arabia", hi: "सऊदी अरब" },
  jobsQuery: "Saudi Arabia",
  exploreCta: { en: "Explore Saudi Arabia | सऊदी अरब देखें", hi: "सऊदी अरब देखें" },
  detailReady: true,
});

const qatar = buildCountryInsight({
  id: "qatar",
  slug: "qatar",
  flag: "🇶🇦",
  name: { en: "Qatar", hi: "कतर" },
  jobsQuery: "Qatar",
  exploreCta: { en: "Explore Qatar | कतर देखें", hi: "कतर देखें" },
  detailReady: true,
});

const oman = buildCountryInsight({
  id: "oman",
  slug: "oman",
  flag: "🇴🇲",
  name: { en: "Oman", hi: "ओमान" },
  jobsQuery: "Oman",
  exploreCta: { en: "Explore Oman | ओमान देखें", hi: "ओमान देखें" },
  detailReady: true,
});

const kuwait = buildCountryInsight({
  id: "kuwait",
  slug: "kuwait",
  flag: "🇰🇼",
  name: { en: "Kuwait", hi: "कुवैत" },
  jobsQuery: "Kuwait",
  exploreCta: { en: "Explore Kuwait | कुवैत देखें", hi: "कुवैत देखें" },
  detailReady: true,
});

const bahrain = buildCountryInsight({
  id: "bahrain",
  slug: "bahrain",
  flag: "🇧🇭",
  name: { en: "Bahrain", hi: "बहरीन" },
  jobsQuery: "Bahrain",
  exploreCta: { en: "Explore Bahrain | बहरीन देखें", hi: "बहरीन देखें" },
  detailReady: true,
});

export const COUNTRY_INSIGHTS: CountryInsight[] = [uae, saudi, qatar, oman, kuwait, bahrain];

export function getCountryInsight(slug: string | undefined): CountryInsight | undefined {
  if (!slug) return undefined;
  return COUNTRY_INSIGHTS.find((c) => c.slug === slug);
}
