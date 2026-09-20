import constructionImg from "@/assets/trade-construction.jpg";
import electricalImg from "@/assets/trade-electrical.jpg";
import welderImg from "@/assets/trade-welder.jpg";
import acTechnicianImg from "@/assets/trades/ac-technician.jpg";
import type { TradeCategory } from "./types";

/** Homepage trade categories — curated groups, not the full Find-jobs catalog. */
export const tradeCategories: TradeCategory[] = [
  {
    id: "electrician",
    name: "Electrician",
    hindiName: "बिजली मिस्त्री",
    image: electricalImg,
    imageAlt: "Electrician working on an electrical control panel",
    skills: ["Wiring", "DB / MCB", "Testing"],
    verification: "Skill Verification",
    objectPosition: "center 30%",
  },
  {
    id: "plumber",
    name: "Plumber",
    hindiName: "नलसाज़",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Representative image of plumbing work — pipes and fittings",
    skills: ["Piping", "Fixtures", "Drainage"],
    verification: "Skill Screening",
    objectPosition: "center center",
  },
  {
    id: "welder",
    name: "Welder",
    hindiName: "वेल्डिंग मिस्त्री",
    image: welderImg,
    imageAlt: "Welder holding a welding helmet",
    skills: ["ARC", "MIG", "TIG"],
    verification: "Trade Assessment",
    objectPosition: "center 20%",
  },
  {
    id: "hvac",
    name: "AC Technician",
    hindiName: "एसी मिस्त्री",
    image: acTechnicianImg,
    imageAlt: "AC technician servicing an air-conditioning unit",
    skills: ["Installation", "Servicing", "Controls"],
    verification: "Skill Verification",
    objectPosition: "center 30%",
  },
  {
    id: "fitter",
    name: "Fitter",
    hindiName: "जोड़ने-लगाने वाला",
    image: constructionImg,
    imageAlt: "Skilled tradespeople on a construction site — representative image for fitters",
    skills: ["Assembly", "Alignment", "Maintenance"],
    verification: "Skill Screening",
    objectPosition: "right center",
  },
  {
    id: "construction",
    name: "Construction",
    hindiName: "निर्माण कार्य",
    image: constructionImg,
    imageAlt: "Construction workers in safety gear on a building site",
    skills: ["Formwork", "Masonry", "Safety"],
    verification: "Skill Screening",
    objectPosition: "center center",
  },
  {
    id: "driver",
    name: "Driver & Logistics",
    hindiName: "चालक एवं माल ढुलाई",
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Representative image of a heavy vehicle used in logistics",
    skills: ["HMV", "Route", "Safety"],
    verification: "Skill Screening",
    objectPosition: "center center",
  },
];
