import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ENGLISH_POINTS = [
  "The Insured person shall be covered for a sum of Rs.10.00 lakhs in the event of accidental death or permanent disability leading to loss of employment while in employment abroad, irrespective of change of employer/location of insured person.",
  "Certification of accidental death or permanent disability by Indian Missions and Posts abroad shall be accepted by the insurance companies.",
  "Medical insurance cover including injuries / sickness / ailment / diseases available upto Rs.1,00,000/- (up to Rs. 50,000 per hospitalization).",
  "Repatriation cover for medically unfit/premature termination of employment: Actual one-way economy class air fare to the nearest international airport in India.",
  "Family Hospitalization in India available upto Rs. 50,000/- for Spouse and first two children upto 21 years of age.",
  "Maternity expenses benefit to women emigrants available upto Rs. 50,000/-.",
  "Reimbursement of return economy class air fare to the nearest international airport to one attendant in case of emigrant’s accidental death or permanent disability.",
  "Legal expenses on litigation related to emigrant’s overseas employment admissible upto Rs. 45,000/-.",
  "Provision for on-line renewal of PBBY policy.",
] as const;

const HINDI_POINTS = [
  "बीमाकृत व्यक्ति को विदेश में रोजगार के दौरान रोजगार छूटने की स्थिति में आकस्मिक मृत्यु या स्थायी विकलांगता के मामले में 10.00 लाख रुपये की राशि के लिए कवर किया जाएगा, चाहे नियोक्ता/बीमाकृत व्यक्ति के स्थान में कोई भी बदलाव हो।",
  "भारतीय मिशनों और विदेशों में पोस्ट द्वारा आकस्मिक मृत्यु या स्थायी विकलांगता के प्रमाणीकरण को बीमा कंपनियों द्वारा स्वीकार किया जाएगा।",
  "चोटों/बीमारी/रोग सहित चिकित्सा बीमा कवर 1,00,000/- रुपये तक (प्रति अस्पताल भर्ती 50,000 रुपये तक) उपलब्ध है।",
  "चिकित्सकीय रूप से अयोग्य/रोजगार की समय से पहले समाप्ति के लिए प्रत्यावर्तन कवर: भारत के निकटतम अंतरराष्ट्रीय हवाई अड्डे के लिए वास्तविक एक तरफा इकोनॉमी क्लास हवाई किराया।",
  "भारत में पारिवारिक अस्पताल में भर्ती जीवनसाथी और 21 वर्ष की आयु तक के पहले दो बच्चों के लिए 50,000/- रुपये तक उपलब्ध है।",
  "महिला प्रवासियों को मातृत्व व्यय लाभ 50,000/- रुपये तक उपलब्ध है।",
  "प्रवासी की आकस्मिक मृत्यु या स्थायी विकलांगता के मामले में एक परिचारक को निकटतम अंतरराष्ट्रीय हवाई अड्डे के लिए वापसी इकोनॉमी क्लास हवाई किराए की प्रतिपूर्ति।",
  "प्रवासी के विदेशी रोजगार से संबंधित मुकदमेबाजी पर कानूनी खर्च 45,000/- रुपये तक स्वीकार्य है।",
  "PBBY पॉलिसी के ऑनलाइन नवीनीकरण का प्रावधान।",
] as const;

function CoverageList({ points }: { points: readonly string[] }) {
  return (
    <ul className="space-y-2.5 text-sm leading-relaxed text-foreground">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

export default function InsuranceCoverageInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-0.5 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Insurance coverage | बीमा कवर"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-left leading-snug">
            Insurance | बीमा
          </DialogTitle>
          <DialogDescription className="sr-only">
            Pravasi Bharatiya Bima Yojana (PBBY) coverage included in this payment, in English and
            Hindi.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="en" className="w-full">
          <TabsList className="grid h-10 w-full grid-cols-2">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="hi">हिंदी</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="mt-3">
            <CoverageList points={ENGLISH_POINTS} />
          </TabsContent>
          <TabsContent value="hi" className="mt-3">
            <CoverageList points={HINDI_POINTS} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
