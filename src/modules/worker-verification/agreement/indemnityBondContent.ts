export const INDEMNITY_BOND_VERSION = 'indemnity-bond-v1-2026-09';

export const INDEMNITY_BOND_STAMP_INR = 100;

export type BondLang = 'hi' | 'en';

export type BondClause = {
  no: string;
  hi: string;
  en: string;
};

export const INDEMNITY_BOND_TITLE = {
  hi: 'विदेश रोजगार हेतु सहमति पत्र / घोषणा पत्र एवं क्षतिपूर्ति बंधपत्र (Indemnity Bond)',
  en: 'Overseas Employment Consent, Declaration & Indemnity Bond',
} as const;

export const INDEMNITY_BOND_SUBTITLE = {
  hi: 'Candidate Employment Continuation Bond & Guarantee Agreement',
  en: 'Candidate Employment Continuation Bond & Guarantee Agreement',
} as const;

export const INDEMNITY_BOND_PREAMBLE = {
  hi: 'यह कि, मैं श्री/श्रीमती __________________ पुत्र/पुत्री/पत्नी __________________ निवासी ________________________ अपनी पूर्ण स्वेच्छा, बिना किसी दबाव, प्रलोभन अथवा मजबूरी के विदेश में रोजगार हेतु जाने के लिए सहमत हूँ तथा निम्नलिखित नियम एवं शर्तों को पढ़कर, समझकर एवं स्वीकार करता/करती हूँ। यह अनुबंध अभ्यर्थी, गारंटर तथा SafeWork Global (एजेंसी/सलाहकार) के बीच निष्पादित किया जाता है।',
  en: 'I, Mr/Ms __________________, son/daughter/spouse of __________________, resident of ________________________, of my own free will, without pressure, inducement or compulsion, agree to proceed abroad for employment and have read, understood and accepted the following terms. This Agreement is executed among the Candidate, the Guarantor and SafeWork Global (the “Agency/Consultant”).',
} as const;

export const INDEMNITY_BOND_HIGHLIGHTS = {
  hi: [
    'कम से कम 2 वर्ष तक कार्य करने की सहमति',
    '6 माह की परिवीक्षा अवधि',
    'कर्मचारी एवं गारंटर के सुरक्षा चेक',
    '₹100 स्टाम्प पेपर पर नोटरीकृत Indemnity Bond',
  ],
  en: [
    'Agree to work for at least 2 years',
    'Six-month probation period',
    'Security cheques from the worker and the guarantor',
    'Notarised Indemnity Bond on ₹100 stamp paper',
  ],
} as const;

/** Journey-only: how to execute and submit the bond. */
export const INDEMNITY_BOND_EXECUTION = {
  title: {
    hi: 'Indemnity Bond कैसे जमा करें',
    en: 'How to complete this Indemnity Bond',
  },
  body: {
    hi: 'यह दस्तावेज़ Indemnity Bond (क्षतिपूर्ति बंधपत्र) कहलाता है। इसे ₹100 के स्टाम्प पेपर पर नोटरी करवाएँ। फिर नोटरी किया हुआ बॉन्ड इस पोर्टल पर अपलोड करें, अथवा मूल स्टाम्प पेपर कर्मचारी और गारंटर दोनों के आधार कार्ड की प्रतियों के साथ हमें भेजें।',
    en: 'This document is an Indemnity Bond. Get it notarised on a ₹100 stamp paper. Then upload the notarised bond on this platform, or send the original stamp paper to us together with Aadhaar copies of both the worker and the guarantor.',
  },
  bullets: {
    hi: [
      '₹100 के स्टाम्प पेपर पर पूरा बॉन्ड लिखें/प्रिंट करें',
      'नोटरी से सत्यापित करवाएँ',
      'कर्मचारी और गारंटर के आधार कार्ड की प्रतियाँ साथ लगाएँ',
      'यहाँ अपलोड करें, या मूल दस्तावेज़ हमें भेजें',
    ],
    en: [
      'Print or write the full bond on ₹100 stamp paper',
      'Get it notarised',
      'Attach Aadhaar copies of the worker and the guarantor',
      'Upload it here, or send the original to us',
    ],
  },
} as const;

export const INDEMNITY_BOND_CLAUSES: BondClause[] = [
  {
    no: '1',
    hi: 'यह कि मैं अपनी पूर्ण स्वेच्छा से विदेश में रोजगार हेतु जा रहा/रही हूँ तथा इस संबंध में किसी प्रकार का दबाव, प्रलोभन अथवा मजबूरी नहीं है।',
    en: 'I am proceeding abroad for employment of my own free will. There is no pressure, inducement or compulsion in this regard.',
  },
  {
    no: '2',
    hi: 'यह कि मेरी आयु 18 वर्ष से अधिक है तथा मैं शारीरिक एवं मानसिक रूप से कार्य करने के लिए पूर्णतः सक्षम हूँ।',
    en: 'I am above 18 years of age and am physically and mentally fit to work.',
  },
  {
    no: '3',
    hi: 'यह कि मैं जिस देश में नियुक्त किया जाऊँगा/जाऊँगी, वहाँ के सभी कानूनों, नियमों, नियोक्ता (Employer) के सेवा नियमों एवं रोजगार अनुबंध (Employment Contract) का पूर्णतः पालन करूँगा/करूँगी।',
    en: 'I shall fully comply with the laws and rules of the country of employment, the Employer’s service rules, and the Employment Contract.',
  },
  {
    no: '4',
    hi: 'यह कि विदेश में रोजगार उपलब्ध कराने तथा मुझे विदेश भेजने की प्रक्रिया हेतु नियोक्ता/विदेश में नौकरी उपलब्ध कराने वाले व्यक्ति/संस्था द्वारा मेरे ऊपर वीज़ा, प्रोसेसिंग, समन्वय एवं अन्य आवश्यक व्यवस्थाओं पर ₹1,00,000/- (एक लाख रुपये) तथा फ्लाइट टिकट पर ₹20,000/- (बीस हजार रुपये), कुल ₹1,20,000/- (एक लाख बीस हजार रुपये) का व्यय किया जा रहा है, जिसकी जानकारी मुझे है एवं मैं इसे स्वीकार करता/करती हूँ।',
    en: 'I acknowledge that for arranging overseas employment and deploying me abroad, the Employer/Agency is incurring about ₹1,00,000 (one lakh rupees) on visa, processing, coordination and related arrangements, and about ₹20,000 (twenty thousand rupees) on the flight ticket, totalling ₹1,20,000 (one lakh twenty thousand rupees). I accept this.',
  },
  {
    no: '5',
    hi: 'यह कि मैं विदेश में कम से कम 2 (दो) वर्ष तक कार्य करने के लिए सहमत हूँ तथा इस अवधि से पूर्व अपनी इच्छा से नौकरी नहीं छोड़ूँगा/छोड़ूँगी, जब तक कि नियोक्ता अथवा लागू कानून के अनुसार अनुमति प्राप्त न हो। परिवीक्षा अवधि (Probation Period) अभ्यर्थी के वास्तविक जॉइनिंग दिनांक से छह (6) माह होगी, जब तक रोजगार अनुबंध में कोई अन्य अवधि स्पष्ट रूप से न हो।',
    en: 'I agree to work abroad for at least two (2) years and shall not leave of my own will before that period unless permitted by the Employer or applicable law. The Probation Period is six (6) months from my actual date of joining, unless a different period is stated in the employment contract.',
  },
  {
    no: '6',
    hi: 'यह कि मैं अपने सभी आवश्यक एवं वैध दस्तावेज, जैसे पासपोर्ट, वीज़ा, आधार कार्ड, शैक्षणिक प्रमाण-पत्र, अनुभव प्रमाण-पत्र, पुलिस सत्यापन, मेडिकल रिपोर्ट एवं अन्य आवश्यक दस्तावेज सत्य एवं सही रूप में प्रस्तुत करूँगा/करूँगी।',
    en: 'I shall submit all necessary and genuine documents, including passport, visa, Aadhaar, educational certificates, experience certificates, police verification, medical reports and other required documents, truthfully and correctly.',
  },
  {
    no: '7',
    hi: 'यह कि यदि मेरे द्वारा प्रस्तुत कोई दस्तावेज, प्रमाण-पत्र अथवा जानकारी असत्य, भ्रामक अथवा फर्जी पाई जाती है, तो उसकी सम्पूर्ण जिम्मेदारी मेरी होगी।',
    en: 'If any document, certificate or information submitted by me is found false, misleading or forged, the entire responsibility shall be mine.',
  },
  {
    no: '8',
    hi: 'यह कि मैं स्वयं का तथा अपने गारंटर का एक-एक सुरक्षा (Security) चेक सुरक्षा उद्देश्य से उपलब्ध कराऊँगा/कराऊँगी, जिसका उपयोग मुझे भेजने वाला व्यक्ति/संस्था मेरे द्वारा किसी भी नियम का उल्लंघन करने पर कानूनी तौर पर कर सकेगा। चेक बिना तिथि का (undated) सुरक्षा लिखत है, रिक्त चेक नहीं। एजेंसी इसे केवल वैध Candidate Default होने तथा राशि विधिपूर्वक देय होने पर, लागू कानून के अधीन, प्रस्तुत कर सकती है।',
    en: 'I shall provide one security cheque from myself and one from my Guarantor. The Agency may use these lawfully if I breach the terms of this Agreement. Each cheque is an undated security instrument, not a blank cheque. The Agency may complete the date and present a cheque only after a valid Candidate Default has occurred and the amount has become lawfully payable, subject to applicable law including the Negotiable Instruments Act, 1881.',
  },
  {
    no: '9',
    hi: 'यह कि यदि मैं विदेश पहुँचने के बाद 6 (छः) माह पूर्ण होने से पूर्व अपनी इच्छा से नौकरी छोड़कर भारत वापस लौट आता/आती हूँ अथवा रोजगार अनुबंध का उल्लंघन करता/करती हूँ (वैध Candidate Default), तो मैं अथवा मेरा गारंटर ₹1,20,000/- (एक लाख बीस हजार रुपये) का भुगतान करने के लिए उत्तरदायी होगा/होगी।',
    en: 'If, after reaching abroad, I voluntarily leave employment and return to India before completing six (6) months, or otherwise commit a Candidate Default during the Probation Period, I or my Guarantor shall be liable to pay ₹1,20,000 (one lakh twenty thousand rupees).',
  },
  {
    no: '10',
    hi: 'यह कि यदि मैं 6 (छः) माह पूर्ण होने के बाद किन्तु 2 (दो) वर्ष पूर्ण होने से पूर्व अपनी इच्छा से नौकरी छोड़कर वापस लौटता/लौटती हूँ, तो मुझे ₹75,000/- (पचहत्तर हजार रुपये) का भुगतान करना होगा।',
    en: 'If I voluntarily leave employment after completing six (6) months but before completing two (2) years, I shall pay ₹75,000 (seventy-five thousand rupees).',
  },
  {
    no: '11',
    hi: 'यह कि यदि मेरी नौकरी मेरे अनुशासनहीन व्यवहार, गलत आचरण, झूठी जानकारी, स्थानीय कानूनों के उल्लंघन अथवा मेरी स्वयं की गलती के कारण समाप्त होती है, तो उसकी सम्पूर्ण जिम्मेदारी मेरी होगी। Candidate Default में, बिना सीमा के, नौकरी छोड़कर भाग जाना, जानबूझकर ड्यूटी पर न जाना, जालसाजी, फर्जी दस्तावेज, गंभीर/जानबूझकर कदाचार जिससे सेवा समाप्त हो, शामिल हो सकते हैं।',
    en: 'If my employment ends because of indiscipline, misconduct, false information, violation of local laws, or my own fault, the entire responsibility shall be mine. Candidate Default may include, without limitation, absconding, deliberately refusing to report for duty, fraud, forged or materially false documents, and serious or wilful misconduct that directly results in termination.',
  },
  {
    no: '12',
    hi: 'यह कि निम्नलिखित परिस्थितियाँ सामान्यतः Candidate Default नहीं मानी जाएँगी: नियोक्ता द्वारा अभ्यर्थी की गलती के बिना सेवा समाप्ति, छँटनी, पद का निरस्त होना, नियोक्ता का भौतिक अनुबंध-भंग, प्रमाणित चिकित्सकीय अक्षमता, प्राकृतिक आपदा / force majeure, अथवा ऐसी स्थिति जहाँ सेवा जारी रखना कानूनी रूप से असंभव हो। एजेंसी केवल इसलिए चेक प्रस्तुत नहीं करेगी कि नौकरी परिवीक्षा अवधि में समाप्त हो गई।',
    en: 'The following shall not ordinarily constitute Candidate Default: termination by the Employer for reasons unrelated to my misconduct; redundancy or cancellation of the position; material breach by the Employer; documented medical incapacity; force majeure; or circumstances making continuation legally impossible. The Agency shall not present a security cheque merely because employment ended during the Probation Period.',
  },
  {
    no: '13',
    hi: 'यह कि मैं विदेश में रहते हुए किसी भी प्रकार की अवैध गतिविधि, आपराधिक कृत्य, नशा, चोरी, हिंसा अथवा स्थानीय कानूनों का उल्लंघन नहीं करूँगा/करूँगी। यदि ऐसा कर लिया तो उसकी संपूर्ण जिम्मेदारी मेरी होगी।',
    en: 'While abroad I shall not engage in any illegal activity, criminal act, substance abuse, theft, violence or violation of local laws. If I do, the entire responsibility shall be mine.',
  },
  {
    no: '14',
    hi: 'यह कि मैं बिना नियोक्ता एवं संबंधित देश के नियमों के विरुद्ध किसी अन्य कंपनी या व्यक्ति के लिए कार्य नहीं करूँगा/करूँगी, यदि ऐसा करना मेरे रोजगार अनुबंध या स्थानीय कानून के विरुद्ध हो।',
    en: 'I shall not work for any other company or person in violation of the Employer or the host country’s rules, where that would breach my employment contract or local law.',
  },
  {
    no: '15',
    hi: 'यह कि मैं विदेश जाने से पूर्व अपने रोजगार अनुबंध, वेतन, कार्य का प्रकार, कार्यस्थल एवं अन्य शर्तों को पढ़कर एवं समझकर ही स्वीकार करूँगा/करूँगी।',
    en: 'Before going abroad I shall read and understand my employment contract, salary, nature of work, workplace and other conditions, and only then accept them.',
  },
  {
    no: '16',
    hi: 'यह कि विदेश पहुँचने के उपरांत मेरे रहने (Accommodation), खाने-पीने (Food) एवं अन्य सुविधाओं की व्यवस्था संबंधित नियोक्ता द्वारा नियुक्ति अनुबंध में निर्धारित शर्तों के अनुसार उपलब्ध कराई जाएगी। मैं इस व्यवस्था को स्वीकार करता/करती हूँ।',
    en: 'After arrival, accommodation, food and other facilities shall be provided by the Employer as set out in the appointment/employment contract. I accept that arrangement.',
  },
  {
    no: '17',
    hi: 'यह कि विदेश भेजने वाला व्यक्ति/संस्था केवल मुझे रोजगार उपलब्ध कराने, वीज़ा प्रक्रिया पूर्ण कराने एवं विदेश भेजने तक अपनी सेवाएँ प्रदान करेगा/करेगी। विदेश पहुँचने के पश्चात कार्यस्थल, वेतन, कार्य की प्रकृति, रहने एवं खाने-पीने की व्यवस्था तथा सेवा संबंधी अन्य शर्तें संबंधित नियोक्ता एवं रोजगार अनुबंध के अनुसार संचालित होंगी। यह अनुबंध अभ्यर्थी के वैधानिक रोजगार अधिकारों को अवैध रूप से सीमित नहीं करता।',
    en: 'The Agency’s services cover arranging employment, completing the visa process and deploying me abroad. After arrival, workplace, salary, nature of work, accommodation, food and other service conditions are governed by the Employer and the employment contract. Nothing in this Agreement prevents me from exercising any mandatory statutory employment right, including under UAE law where applicable.',
  },
  {
    no: '18',
    hi: 'यह कि यदि मेरे द्वारा जानबूझकर गलत जानकारी देकर अथवा अनुबंध का उल्लंघन कर किसी प्रकार की आर्थिक अथवा अन्य हानि पहुँचाई जाती है, तो मैं उसके लिए लागू कानून के अनुसार उत्तरदायी रहूँगा/रहूँगी।',
    en: 'If I cause any financial or other loss by knowingly giving false information or by breaching this Agreement, I shall be liable under applicable law.',
  },
  {
    no: '19',
    hi: 'यह कि विदेश में रहते समय बीमारी, दुर्घटना, प्राकृतिक आपदा अथवा किसी अन्य अप्रत्याशित घटना की स्थिति में उपलब्ध सहायता बीमा (यदि लागू हो) नियोक्ता अथवा संबंधित देश के कानून के अनुसार प्रदान की जाएगी।',
    en: 'In case of illness, accident, natural disaster or other unforeseen event while abroad, available assistance and insurance (if applicable) shall be provided in accordance with the Employer or the host country’s law.',
  },
  {
    no: '20',
    hi: 'यह कि यदि विदेश में रहते समय मेरी बीमारी, दुर्घटना अथवा मृत्यु हो जाती है और उसमें विदेश भेजने वाले व्यक्ति/संस्था की कोई सिद्ध लापरवाही, धोखाधड़ी या कानूनी जिम्मेदारी स्थापित नहीं होती है, तो ऐसी स्थिति के लिए विदेश भेजने वाले व्यक्ति/संस्था को उत्तरदायी नहीं ठहराया जाएगा।',
    en: 'If I fall ill, meet with an accident or die while abroad, and no proven negligence, fraud or legal liability of the Agency is established, the Agency shall not be held liable for that situation.',
  },
  {
    no: '21',
    hi: 'यह कि किसी भी विवाद की स्थिति में दोनों पक्ष पहले आपसी सहमति से समाधान का प्रयास करेंगे। समाधान न होने पर यह अनुबंध भारत के कानूनों के अधीन होगा तथा विवाद का निस्तारण दिल्ली, भारत के सक्षम न्यायालयों एवं लागू कानून के अनुसार किया जाएगा। सुरक्षा चेक संबंधी मामले Negotiable Instruments Act, 1881 के अधीन होंगे।',
    en: 'In case of any dispute the Parties shall first attempt an amicable settlement. Failing that, this Agreement shall be governed by the laws of India, and disputes shall be subject to the competent courts in Delhi, India. Matters concerning the security cheque shall be governed by the Negotiable Instruments Act, 1881 and other applicable Indian law. This does not exclude any mandatory law applicable to employment in the United Arab Emirates.',
  },
  {
    no: '22',
    hi: 'यह कि वैध Candidate Default की स्थिति में एजेंसी, जहाँ व्यावहारिक हो, अभ्यर्थी एवं गारंटर को लिखित सूचना देगी जिसमें आरोपित default, तिथि, दावा की गई राशि एवं संबंधित खंड का उल्लेख होगा। छः माह की परिवीक्षा सफलतापूर्वक पूर्ण होने तथा कोई बकाया न होने पर मूल सुरक्षा चेक गारंटर को लौटा दिया जाएगा।',
    en: 'Where a valid Candidate Default is alleged, the Agency shall, where reasonably practicable, give written notice to the Candidate and Guarantor setting out the nature of the default, the date, the amount claimed and the clause relied upon. Upon successful completion of the six-month Probation Period with no outstanding liability, the original security cheque shall be returned to the Guarantor.',
  },
  {
    no: '23',
    hi: 'गारंटर पुष्टि करता/करती है कि वह अभ्यर्थी का परिवार सदस्य है, उसने यह अनुबंध पढ़कर समझ लिया है, तथा अभ्यर्थी द्वारा देय राशि का भुगतान न करने पर, लागू कानून के अधीन, गारंटीकृत राशि तक उत्तरदायी रहेगा/रहेगी। गारंटर की देयता मात्र इसलिए उत्पन्न नहीं होगी कि नौकरी परिवीक्षा अवधि में समाप्त हो गई।',
    en: 'The Guarantor confirms that he/she is a family member of the Candidate, has read and understood this Agreement, and, subject to applicable law, guarantees payment of the amount lawfully payable if the Candidate fails to discharge it. The Guarantor is not liable merely because employment ended during the Probation Period. Both the Candidate and the Guarantor have had an opportunity to obtain independent legal advice before signing.',
  },
  {
    no: '24',
    hi: 'यह कि मैं यह घोषणा करता/करती हूँ कि उपरोक्त सभी नियम एवं शर्तें मैंने स्वयं पढ़ ली हैं अथवा मुझे पढ़कर सुनाई गई हैं, जिन्हें मैं पूर्णतः समझकर अपनी स्वतंत्र इच्छा से स्वीकार करता/करती हूँ।',
    en: 'I declare that I have myself read the above terms, or that they have been read out to me, and that I fully understand and accept them of my own free will, without coercion, threat or undue influence.',
  },
];

export const INDEMNITY_BOND_SIGNATURES = {
  hi: [
    'कर्मचारी का नाम : ____________________',
    'हस्ताक्षर : ____________________',
    'गारंटर का नाम : ____________________',
    'गारंटर के हस्ताक्षर : ____________________',
    'विदेश रोजगार उपलब्ध कराने वाले व्यक्ति/संस्था के हस्ताक्षर : ____________________',
    'गवाह-1 : ____________________',
    'गवाह-2 : ____________________',
    'स्थान : ____________________',
    'दिनांक : __ / __ / 20____',
  ],
  en: [
    'Candidate name: ____________________',
    'Candidate signature: ____________________',
    'Guarantor name: ____________________',
    'Guarantor signature: ____________________',
    'Agency / Consultant authorised signatory: ____________________',
    'Witness 1: ____________________',
    'Witness 2: ____________________',
    'Place: ____________________',
    'Date: __ / __ / 20____',
  ],
} as const;

export const INDEMNITY_BOND_PARTICULARS = {
  candidate: {
    hi: ['नाम', 'पासपोर्ट संख्या', 'राष्ट्रीयता', 'जन्म तिथि', 'स्थायी पता', 'मोबाइल', 'ईमेल'],
    en: ['Name', 'Passport no.', 'Nationality', 'Date of birth', 'Permanent address', 'Mobile', 'Email'],
  },
  guarantor: {
    hi: ['नाम', 'अभ्यर्थी से संबंध', 'पासपोर्ट / पहचान संख्या', 'जन्म तिथि', 'स्थायी पता', 'मोबाइल', 'ईमेल'],
    en: ['Name', 'Relationship with candidate', 'Passport / ID no.', 'Date of birth', 'Permanent address', 'Mobile', 'Email'],
  },
  employment: {
    hi: ['नियोक्ता / क्लाइंट', 'पदनाम', 'कार्यस्थल', 'देश: संयुक्त अरब अमीरात', 'रोजगार अनुबंध तिथि', 'परिवीक्षा: जॉइनिंग से 6 माह'],
    en: ['Employer / Client', 'Job title', 'Place of employment', 'Country: United Arab Emirates', 'Employment contract date', 'Probation: 6 months from joining'],
  },
} as const;

export const INDEMNITY_BOND_SCHEDULE_A = {
  title: { hi: 'अनुसूची क — सुरक्षा चेक विवरण', en: 'Schedule A — Security cheque details' },
  fields: {
    hi: [
      'अभ्यर्थी का नाम',
      'गारंटर का नाम',
      'अंतर्निहित देयता',
      'चेक जारीकर्ता',
      'चेक संख्या',
      'बैंक / शाखा',
      'खाता संख्या',
      'चेक राशि',
      'चेक तिथि: बिना तिथि (UNDATED)',
      'जमा करने की तिथि',
      'आदाता (Payee)',
    ],
    en: [
      'Candidate name',
      'Guarantor name',
      'Underlying liability',
      'Cheque issued by',
      'Cheque no.',
      'Bank / branch',
      'Account no.',
      'Cheque amount',
      'Cheque date: UNDATED',
      'Date of submission',
      'Payee name',
    ],
  },
} as const;

export const INDEMNITY_BOND_SCHEDULE_B = {
  title: { hi: 'अनुसूची ख — सुरक्षा चेक वापसी रसीद', en: 'Schedule B — Security cheque return acknowledgement' },
  body: {
    hi: 'मैं, गारंटर, पुष्टि करता/करती हूँ कि मुझे अभ्यर्थी की छह माह की परिवीक्षा सफलतापूर्वक पूर्ण होने तथा कोई बकाया न होने पर मूल सुरक्षा चेक वापस प्राप्त हो गया है। एजेंसी उस लिखत को अब प्रस्तुत नहीं कर सकती।',
    en: 'I, the Guarantor, acknowledge that I have received back the original security cheque after the Candidate successfully completed the six-month Probation Period and there is no outstanding liability. The Agency shall no longer retain or present that instrument.',
  },
} as const;
