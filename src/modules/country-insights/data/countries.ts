import type { CountryInsight } from "../types";
import { buildCountryInsight, GCC_SECTORS, LISTING_BLURB } from "./shared";
import { UAE_ALL_PHOTOS, UAE_PHOTOS } from "./uaePhotos";

const uaeBase = buildCountryInsight({
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

const uae: CountryInsight = {
  ...uaeBase,
  hero: {
    ...uaeBase.hero,
    collage: [
      { ...UAE_PHOTOS.skyline, category: "City & infrastructure" },
      { ...UAE_PHOTOS.rebar, category: "Skilled work" },
      { ...UAE_PHOTOS.crane, category: "Construction / worksite" },
      { ...UAE_PHOTOS.housingExterior, category: "Worker accommodation" },
    ],
  },
  workingEnvironment: {
    ...uaeBase.workingEnvironment,
    sectors: uaeBase.workingEnvironment.sectors.map((sector) => {
      if (sector.id === "construction") return { ...sector, image: UAE_PHOTOS.crane };
      if (sector.id === "mep") return { ...sector, image: UAE_PHOTOS.rebar };
      return sector;
    }),
  },
  accommodation: {
    ...uaeBase.accommodation,
    photos: [
      UAE_PHOTOS.housingExterior,
      UAE_PHOTOS.courtyard,
      ...uaeBase.accommodation.photos.filter((p) => p.id !== "ext" && p.id !== "bed"),
    ],
  },
  workingConditions: {
    ...uaeBase.workingConditions,
    cards: uaeBase.workingConditions.cards.map((card) => {
      if (card.id === "outdoor") return { ...card, image: UAE_PHOTOS.businessBay1 };
      if (card.id === "sites") return { ...card, image: UAE_PHOTOS.crane };
      if (card.id === "heat") return { ...card, image: UAE_PHOTOS.skyline };
      if (card.id === "ppe") return { ...card, image: UAE_PHOTOS.rebar };
      return card;
    }),
  },
  livingConditions: {
    ...uaeBase.livingConditions,
    photos: [
      UAE_PHOTOS.housingExterior,
      UAE_PHOTOS.courtyard,
      ...uaeBase.livingConditions.photos.slice(2),
    ],
  },
  opportunityReality: {
    ...uaeBase.opportunityReality,
    opportunityImage: UAE_PHOTOS.skyline,
    realityImage: UAE_PHOTOS.businessBay2,
  },
  photoGallery: {
    ...uaeBase.photoGallery,
    photos: UAE_ALL_PHOTOS,
  },
};

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

const ALL_COUNTRY_INSIGHTS: CountryInsight[] = [uae, saudi, qatar, oman, kuwait, bahrain];

/** Public listing and detail routes — UAE only for now. */
export const COUNTRY_INSIGHTS: CountryInsight[] = ALL_COUNTRY_INSIGHTS.filter((c) => c.slug === "uae");

export function getCountryInsight(slug: string | undefined): CountryInsight | undefined {
  if (!slug) return undefined;
  return COUNTRY_INSIGHTS.find((c) => c.slug === slug);
}

export function getCountryInsightComparisonColumns(): CountryInsight[] {
  return ALL_COUNTRY_INSIGHTS;
}
