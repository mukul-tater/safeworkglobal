import type { WorkerLocale } from "@/modules/worker-registration/i18n/types";

export type AppLocale = WorkerLocale;
export type AppMessageKey = keyof typeof en;

const en = {
  "nav.findJobs": "Find Jobs",
  "nav.findWorkers": "Find Workers",
  "nav.about": "About Us",
  "nav.contact": "Contact",
  "nav.home": "Home",
  "nav.jobs": "Jobs",
  "nav.account": "Account",
  "nav.login": "Login",
  "nav.logout": "Logout",

  "header.getStarted": "Get Started",
  "header.dashboard": "Dashboard",
  "header.myAccount": "My Account",
  "header.goDashboard": "Go to Dashboard",
  "header.signOut": "Sign Out",
  "header.iWantTo": "I want to…",
  "header.findJob": "Find a job",
  "header.findJobSub": "Sign up as a Worker",
  "header.hire": "Hire workers",
  "header.hireSub": "Sign up as an Employer",
  "header.partner": "Partner",
  "header.partnerSub": "E-Mitra, SSVN, ITI, MEA Licensed RA, consultants & employers",
  "header.workerSignIn": "Already registered as a worker? Sign in",
  "header.employerSignIn": "Employer account? Sign in",
  "header.partnerSignIn": "Partner account? Sign in",
  "header.findJobCta": "Find a job (Worker signup)",
  "header.hireCta": "Hire workers (Employer signup)",

  "lang.aria": "Language / भाषा",

  "hero.employerTitle1": "Hire verified workers.",
  "hero.employerTitle2": "Ready to deploy.",
  "hero.workerTitle1": "Verified jobs abroad.",
  "hero.workerTitle2": "Clear contracts.",
  "hero.employerBody":
    "Skill-tested, document-verified Indian workers — deployed through licensed recruitment partners.",
  "hero.workerBody":
    "We verify your documents and skills, then connect you to overseas employers through licensed recruitment partners.",
  "hero.browseWorkers": "Browse Workers",
  "hero.browseJobs": "Browse Jobs",
  "hero.imEmployer": "I'm an employer",
  "hero.employerTrust": "Verified workers · Skill & trade tested · Licensed partner deployment",
  "hero.workerTrust": "Verified employers · Skill-tested profile · Licensed partner deployment",
  "hero.employerToast": "This is an employer account. Switch to a worker account to browse jobs.",
  "hero.workerToast": "This is a worker account. Switch to an employer account to hire workers.",

  "search.workers": "Search verified workers",
  "search.jobs": "Search verified jobs abroad",
  "search.skillPlaceholder": "Skill or worker type",
  "search.jobPlaceholder": "Job title or skill",
  "search.country": "Country",

  "why.badge": "Why SafeWork Global",
  "why.title1": "Replacing unsafe agents with a",
  "why.title2": "compliance-first",
  "why.title3": "platform",
  "why.p1":
    "Every year, Indian workers lose lakhs to fake overseas job agents — paying ₹50,000 to ₹2,00,000 upfront for jobs that never exist. SafeWork Global verifies both sides before anyone commits: your documents and skills, and the employer offering the job.",
  "why.p2":
    "We are building the trusted infrastructure for safe, ethical migrant employment — starting with UAE, Oman, and expanding across the GCC, Japan, and Europe.",
  "why.agentsTitle": "What workers face with agents",
  "why.agent1": "Hidden fees of 10–30% of your salary",
  "why.agent2": "Fake job offers and passport retention",
  "why.agent3": "No written contract — verbal promises only",
  "why.agent4": "No protection if employer doesn't pay",
  "why.agent5": "Forced into unsafe, unregulated migration routes",
  "why.t1": "Verified jobs only",
  "why.t1d": "Every employer and job listing is checked by our team before it goes live.",
  "why.t2": "Your skills, proven",
  "why.t2d":
    "Skill test, trade test, and medical checks build a profile employers can trust before they interview you.",
  "why.t3": "Licensed partner deployment",
  "why.t3d":
    "Visa, emigration, and travel are handled by licensed recruitment partners, following Indian emigration rules.",
  "why.t4": "Everything in writing",
  "why.t4d":
    "You see your job terms, salary, and deductions in a written contract before you agree to travel.",

  "how.badge": "How we work",
  "how.title1": "Verification by us.",
  "how.title2": "Deployment by licensed partners.",
  "how.intro":
    "SafeWork Global is the verification layer between Indian workers and overseas employers — we make sure both sides are genuine before anyone commits.",
  "how.step": "Step {{n}}",
  "how.s1": "We verify the worker",
  "how.s1d":
    "Identity, documents, skill test, trade test, and medical checks — so an employer only ever sees genuine, job-ready candidates.",
  "how.s2": "The employer selects directly",
  "how.s2d":
    "Employers review verified profiles and interview the workers they want. The job terms and salary are agreed between the employer and the worker, in writing.",
  "how.s3": "Licensed partners deploy",
  "how.s3d":
    "Visa, emigration clearance, and travel are carried out by licensed recruitment partners, in line with Indian emigration rules.",
  "how.note":
    "SafeWork Global is a verification and matching platform. We do not recruit on our own licence and we do not hold or pay wages — salary is paid by your employer under the contract you sign, and emigration is carried out by our licensed partners.",

  "cta.title": "Ready to work abroad safely?",
  "cta.auth": "Browse verified jobs and apply in minutes.",
  "cta.guest": "Create your profile free and get verified for overseas openings.",
  "cta.signUp": "Sign Up Free",
  "cta.viewAll": "View All Jobs",

  "footer.blurb":
    "SafeWork Global is a technology and workforce mobility platform. Connecting skilled workers with verified overseas opportunities.",
  "footer.workers": "For Workers",
  "footer.findJobs": "Find Jobs",
  "footer.createProfile": "Create Profile",
  "footer.stories": "Success Stories",
  "footer.support": "Support Center",
  "footer.employers": "For Employers",
  "footer.browseWorkers": "Browse Workers",
  "footer.postJob": "Post a Job",
  "footer.how": "How It Works",
  "footer.benefits": "Benefits for Employers",
  "footer.talk": "Talk to our team",
  "footer.resources": "Resources",
  "footer.faq": "FAQ",
  "footer.insights": "Country Insights",
  "footer.culture": "Cultural Guides",
  "footer.legal": "Legal Advice",
  "footer.stay": "Stay Updated",
  "footer.staySub": "Get weekly updates on new opportunities and career insights.",
  "footer.email": "Enter your email",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.ra":
    "Licensed & regulated. SafeWork Global is a technology and workforce mobility platform. Overseas recruitment through Vesta Immigration LLP, Registered Recruiting Agent (MEA), RC No. B-2069/UP/PART/1000+/5/10331/2023.",
  "footer.employerToast": "You're logged in as an Employer. Sign out to create a Worker profile.",
  "footer.workerToast": "You're logged in as a Worker. Sign out to access employer features.",

  "partner.badge": "Partner network",
  "partner.title": "Become a SafeWork Partner",
  "partner.subtitle":
    "Choose your partner type to continue. Open to placement consultants, recruitment partners, freelancers, NGOs and candidate mobilisers.",
  "partner.type": "Partner type",
  "partner.live": "live",
  "partner.available": "Available",
  "partner.default": "Default",
  "partner.cancel": "Cancel",
  "partner.continue": "Continue as {{name}}",
  "partner.already": "Already a partner?",
  "partner.signIn": "Sign in",
  "partner.confirmTitle": "Continue as {{name}}",
  "partner.confirmBody":
    "You will be redirected to the dedicated {{name}} onboarding form to complete your application.",
  "partner.confirmCta": "Continue to Onboarding",

  "contact.title": "Need Help With Overseas Employment?",
  "contact.subtitle":
    "Connect with SafeWork Global for worker registration, skill verification, employer enquiries, partnership opportunities and overseas employment support.",
  "contact.enquiry": "Send an Enquiry",
  "contact.received": "Enquiry received",
  "contact.thanks": "Thank you. Our team will review your message and get back to you shortly.",
  "contact.another": "Send another enquiry",
} as const;

const hi: Record<AppMessageKey, string> = {
  "nav.findJobs": "नौकरियाँ खोजें",
  "nav.findWorkers": "श्रमिक खोजें",
  "nav.about": "हमारे बारे में",
  "nav.contact": "संपर्क",
  "nav.home": "होम",
  "nav.jobs": "नौकरियाँ",
  "nav.account": "खाता",
  "nav.login": "लॉगिन",
  "nav.logout": "लॉगआउट",

  "header.getStarted": "शुरू करें",
  "header.dashboard": "डैशबोर्ड",
  "header.myAccount": "मेरा खाता",
  "header.goDashboard": "डैशबोर्ड पर जाएँ",
  "header.signOut": "साइन आउट",
  "header.iWantTo": "मैं चाहता/चाहती हूँ…",
  "header.findJob": "नौकरी पाएँ",
  "header.findJobSub": "श्रमिक के रूप में साइन अप करें",
  "header.hire": "श्रमिक भर्ती करें",
  "header.hireSub": "नियोक्ता के रूप में साइन अप करें",
  "header.partner": "साझेदार",
  "header.partnerSub": "ई-मित्र, SSVN, ITI, MEA लाइसेंस्ड RA, सलाहकार और नियोक्ता",
  "header.workerSignIn": "पहले से श्रमिक हैं? साइन इन करें",
  "header.employerSignIn": "नियोक्ता खाता? साइन इन करें",
  "header.partnerSignIn": "साझेदार खाता? साइन इन करें",
  "header.findJobCta": "नौकरी पाएँ (श्रमिक साइन अप)",
  "header.hireCta": "श्रमिक भर्ती करें (नियोक्ता साइन अप)",

  "lang.aria": "Language / भाषा",

  "hero.employerTitle1": "सत्यापित श्रमिक भर्ती करें।",
  "hero.employerTitle2": "तैनाती के लिए तैयार।",
  "hero.workerTitle1": "विदेश में सत्यापित नौकरियाँ।",
  "hero.workerTitle2": "स्पष्ट अनुबंध।",
  "hero.employerBody":
    "कौशल-परीक्षित, दस्तावेज़-सत्यापित भारतीय श्रमिक — लाइसेंस्ड भर्ती साझेदारों के माध्यम से तैनात।",
  "hero.workerBody":
    "हम आपके दस्तावेज़ और कौशल सत्यापित करते हैं, फिर लाइसेंस्ड भर्ती साझेदारों के ज़रिए आपको विदेशी नियोक्ताओं से जोड़ते हैं।",
  "hero.browseWorkers": "श्रमिक देखें",
  "hero.browseJobs": "नौकरियाँ देखें",
  "hero.imEmployer": "मैं नियोक्ता हूँ",
  "hero.employerTrust": "सत्यापित श्रमिक · कौशल व ट्रेड टेस्ट · लाइसेंस्ड साझेदार तैनाती",
  "hero.workerTrust": "सत्यापित नियोक्ता · कौशल-परीक्षित प्रोफ़ाइल · लाइसेंस्ड साझेदार तैनाती",
  "hero.employerToast": "यह नियोक्ता खाता है। नौकरियाँ देखने के लिए श्रमिक खाते से साइन इन करें।",
  "hero.workerToast": "यह श्रमिक खाता है। भर्ती के लिए नियोक्ता खाते से साइन इन करें।",

  "search.workers": "सत्यापित श्रमिक खोजें",
  "search.jobs": "विदेश में सत्यापित नौकरियाँ खोजें",
  "search.skillPlaceholder": "कौशल या श्रमिक प्रकार",
  "search.jobPlaceholder": "पद या कौशल",
  "search.country": "देश",

  "why.badge": "SafeWork Global क्यों",
  "why.title1": "असुरक्षित एजेंटों की जगह",
  "why.title2": "अनुपालन-प्रथम",
  "why.title3": "प्लेटफ़ॉर्म",
  "why.p1":
    "हर साल भारतीय श्रमिक नकली विदेश नौकरी एजेंटों को लाखों रुपये गंवाते हैं — ₹50,000 से ₹2,00,000 तक पहले ही देकर ऐसी नौकरियों के लिए जो कभी होती ही नहीं। SafeWork Global दोनों पक्षों को सत्यापित करता है: आपके दस्तावेज़ और कौशल, और नौकरी देने वाला नियोक्ता।",
  "why.p2":
    "हम सुरक्षित, नैतिक प्रवासी रोजगार का भरोसेमंद इंफ्रास्ट्रक्चर बना रहे हैं — UAE, ओमान से शुरू करके GCC, जापान और यूरोप तक।",
  "why.agentsTitle": "एजेंटों के साथ श्रमिकों को क्या झेलना पड़ता है",
  "why.agent1": "वेतन का 10–30% छिपा शुल्क",
  "why.agent2": "नकली नौकरी प्रस्ताव और पासपोर्ट रोकना",
  "why.agent3": "लिखित अनुबंध नहीं — सिर्फ़ मौखिक वादे",
  "why.agent4": "नियोक्ता भुगतान न करे तो कोई सुरक्षा नहीं",
  "why.agent5": "असुरक्षित, अनियमित प्रवास मार्गों में धकेलना",
  "why.t1": "केवल सत्यापित नौकरियाँ",
  "why.t1d": "हर नियोक्ता और नौकरी लिस्टिंग लाइव होने से पहले हमारी टीम जाँचती है।",
  "why.t2": "आपका कौशल, प्रमाणित",
  "why.t2d":
    "कौशल टेस्ट, ट्रेड टेस्ट और मेडिकल जाँच से एक प्रोफ़ाइल बनती है जिस पर नियोक्ता इंटरव्यू से पहले भरोसा कर सके।",
  "why.t3": "लाइसेंस्ड साझेदार तैनाती",
  "why.t3d":
    "वीज़ा, उत्प्रवास और यात्रा भारतीय उत्प्रवास नियमों के अनुसार लाइसेंस्ड भर्ती साझेदार संभालते हैं।",
  "why.t4": "सब कुछ लिखित",
  "why.t4d":
    "यात्रा से सहमत होने से पहले आपको नौकरी की शर्तें, वेतन और कटौतियाँ लिखित अनुबंध में दिखती हैं।",

  "how.badge": "हम कैसे काम करते हैं",
  "how.title1": "सत्यापन हम करते हैं।",
  "how.title2": "तैनाती लाइसेंस्ड साझेदार करते हैं।",
  "how.intro":
    "SafeWork Global भारतीय श्रमिकों और विदेशी नियोक्ताओं के बीच सत्यापन परत है — कोई भी वचन देने से पहले हम दोनों पक्षों को असली सुनिश्चित करते हैं।",
  "how.step": "चरण {{n}}",
  "how.s1": "हम श्रमिक को सत्यापित करते हैं",
  "how.s1d":
    "पहचान, दस्तावेज़, कौशल टेस्ट, ट्रेड टेस्ट और मेडिकल — ताकि नियोक्ता को केवल असली, नौकरी-तैयार उम्मीदवार दिखें।",
  "how.s2": "नियोक्ता सीधे चुनता है",
  "how.s2d":
    "नियोक्ता सत्यापित प्रोफ़ाइल देखते हैं और इंटरव्यू करते हैं। नौकरी की शर्तें और वेतन नियोक्ता और श्रमिक के बीच लिखित रूप में तय होते हैं।",
  "how.s3": "लाइसेंस्ड साझेदार तैनात करते हैं",
  "how.s3d":
    "वीज़ा, उत्प्रवास मंजूरी और यात्रा भारतीय उत्प्रवास नियमों के अनुसार लाइसेंस्ड भर्ती साझेदार करते हैं।",
  "how.note":
    "SafeWork Global एक सत्यापन और मैचिंग प्लेटफ़ॉर्म है। हम अपने लाइसेंस पर भर्ती नहीं करते और वेतन नहीं रखते — वेतन आपके नियोक्ता द्वारा अनुबंध के तहत दिया जाता है, और उत्प्रवास हमारे लाइसेंस्ड साझेदार करते हैं।",

  "cta.title": "सुरक्षित रूप से विदेश काम करने के लिए तैयार हैं?",
  "cta.auth": "सत्यापित नौकरियाँ देखें और मिनटों में आवेदन करें।",
  "cta.guest": "मुफ़्त प्रोफ़ाइल बनाएँ और विदेशी अवसरों के लिए सत्यापित हों।",
  "cta.signUp": "मुफ़्त साइन अप",
  "cta.viewAll": "सभी नौकरियाँ",

  "footer.blurb":
    "SafeWork Global एक तकनीक और workforce mobility प्लेटफ़ॉर्म है। कुशल श्रमिकों को सत्यापित विदेशी अवसरों से जोड़ता है।",
  "footer.workers": "श्रमिकों के लिए",
  "footer.findJobs": "नौकरियाँ खोजें",
  "footer.createProfile": "प्रोफ़ाइल बनाएँ",
  "footer.stories": "सफलता की कहानियाँ",
  "footer.support": "सहायता केंद्र",
  "footer.employers": "नियोक्ताओं के लिए",
  "footer.browseWorkers": "श्रमिक देखें",
  "footer.postJob": "नौकरी पोस्ट करें",
  "footer.how": "कैसे काम करता है",
  "footer.benefits": "नियोक्ताओं के लाभ",
  "footer.talk": "हमारी टीम से बात करें",
  "footer.resources": "संसाधन",
  "footer.faq": "FAQ",
  "footer.insights": "देश जानकारी",
  "footer.culture": "सांस्कृतिक गाइड",
  "footer.legal": "कानूनी सलाह",
  "footer.stay": "अपडेट रहें",
  "footer.staySub": "नए अवसरों और करियर जानकारी के साप्ताहिक अपडेट पाएँ।",
  "footer.email": "ईमेल दर्ज करें",
  "footer.privacy": "गोपनीयता",
  "footer.terms": "नियम",
  "footer.ra":
    "लाइसेंस्ड और विनियमित। SafeWork Global एक तकनीक और workforce mobility प्लेटफ़ॉर्म है। विदेश भर्ती Vesta Immigration LLP, पंजीकृत Recruiting Agent (MEA), RC No. B-2069/UP/PART/1000+/5/10331/2023 के माध्यम से।",
  "footer.employerToast": "आप नियोक्ता के रूप में लॉग इन हैं। श्रमिक प्रोफ़ाइल बनाने के लिए साइन आउट करें।",
  "footer.workerToast": "आप श्रमिक के रूप में लॉग इन हैं। नियोक्ता सुविधाओं के लिए साइन आउट करें।",

  "partner.badge": "साझेदार नेटवर्क",
  "partner.title": "SafeWork साझेदार बनें",
  "partner.subtitle":
    "आगे बढ़ने के लिए अपना साझेदार प्रकार चुनें। प्लेसमेंट कंसल्टेंट, भर्ती साझेदार, फ्रीलांसर, NGO और कैंडिडेट मोबिलाइज़र आमंत्रित हैं।",
  "partner.type": "साझेदार प्रकार",
  "partner.live": "लाइव",
  "partner.available": "उपलब्ध",
  "partner.default": "डिफ़ॉल्ट",
  "partner.cancel": "रद्द करें",
  "partner.continue": "{{name}} के रूप में जारी रखें",
  "partner.already": "पहले से साझेदार हैं?",
  "partner.signIn": "साइन इन",
  "partner.confirmTitle": "{{name}} के रूप में जारी रखें",
  "partner.confirmBody":
    "आवेदन पूरा करने के लिए आपको {{name}} ऑनबोर्डिंग फ़ॉर्म पर भेजा जाएगा।",
  "partner.confirmCta": "ऑनबोर्डिंग पर जाएँ",

  "contact.title": "विदेश रोजगार से जुड़ी सहायता चाहिए?",
  "contact.subtitle":
    "श्रमिक पंजीकरण, कौशल सत्यापन, नियोक्ता पूछताछ, साझेदारी और विदेश रोजगार सहायता के लिए SafeWork Global से जुड़ें।",
  "contact.enquiry": "पूछताछ भेजें",
  "contact.received": "पूछताछ प्राप्त हुई",
  "contact.thanks": "धन्यवाद। हमारी टीम आपकी पूछताछ देखकर शीघ्र संपर्क करेगी।",
  "contact.another": "एक और पूछताछ भेजें",
};

export const appMessages: Record<AppLocale, Record<AppMessageKey, string>> = { en, hi };

export function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ""));
}
