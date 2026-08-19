import type { PhotoRecord } from "../types";

const BASE = "/country-insights/uae";
const SOURCE =
  "Informational photograph. Not a specific SafeWork employer, project or accommodation facility.";

const photo = (
  id: string,
  file: string,
  category: string,
  location: string,
  altEn: string,
  altHi: string,
): PhotoRecord => ({
  id,
  src: `${BASE}/${file}`,
  category,
  location,
  source: SOURCE,
  alt: { en: altEn, hi: altHi },
});

export const UAE_PHOTOS = {
  businessBay1: photo(
    "uae-bay-1",
    "worksite-business-bay-1.png",
    "Worksites",
    "Dubai, UAE",
    "Construction workers at a road site near Business Bay Crossing, Dubai, wearing safety clothing and hard hats.",
    "दुबई Business Bay Crossing के पास सड़क निर्माण साइट पर सुरक्षा गियर में workers.",
  ),
  rebar: photo(
    "uae-rebar",
    "worksite-rebar.png",
    "Worksites",
    "UAE",
    "Construction workers in PPE tying steel rebar on an outdoor foundation.",
    "PPE में construction workers नींव पर स्टील रेबार बांधते हुए.",
  ),
  crane: photo(
    "uae-crane",
    "worksite-crane.png",
    "Worksites",
    "UAE",
    "Large construction site with workers, scaffolding, rebar and a tower crane.",
    "Workers, scaffolding, रेबार और टावर क्रेन वाली बड़ी निर्माण साइट.",
  ),
  housingExterior: photo(
    "uae-housing-ext",
    "accommodation-exterior.png",
    "Accommodation",
    "UAE",
    "Multi-storey residential block typical of worker housing complexes.",
    "Worker housing जैसी बहु-मंजिला आवासीय इमारत.",
  ),
  businessBay2: photo(
    "uae-bay-2",
    "worksite-business-bay-2.png",
    "Worksites",
    "Dubai, UAE",
    "Workers and a mini-excavator on a road construction site in Dubai.",
    "दुबई में सड़क निर्माण साइट पर workers और मिनी-एक्सकेवेटर.",
  ),
  courtyard: photo(
    "uae-courtyard",
    "accommodation-courtyard.png",
    "Accommodation",
    "UAE",
    "Open courtyard and shared corridors in a high-density residential building.",
    "घने आवासीय भवन का आंगन और साझा गलियारे.",
  ),
  skyline: photo(
    "uae-skyline",
    "worksite-skyline.png",
    "City & Lifestyle",
    "UAE",
    "Workers on a high-rise rebar deck with city towers and cranes in the background.",
    "ऊंची इमारत की रेबार डेक पर workers, पीछे टावर और क्रेन.",
  ),
};

export const UAE_ALL_PHOTOS: PhotoRecord[] = Object.values(UAE_PHOTOS);
