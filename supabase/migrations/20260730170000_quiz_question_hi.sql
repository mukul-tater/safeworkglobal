-- Hindi translations for Test 1 quiz questions.

ALTER TABLE public.worker_skill_quiz_items
  ADD COLUMN IF NOT EXISTS question_hi text;

UPDATE public.worker_skill_quiz_items SET question_hi = v.hi
FROM (VALUES
  ('Have you done basic house / single-phase wiring work like this?', 'क्या आपने इस तरह का घर का / सिंगल-फेज वायरिंग का काम किया है?'),
  ('Should you isolate / lock power before opening a live junction box?', 'क्या जंक्शन बॉक्स खोलने से पहले बिजली बंद / लॉक करनी चाहिए?'),
  ('Is it OK to leave damaged insulation tape as a permanent fix on live wires?', 'क्या जीवित तारों पर खराब इंसुलेशन टेप को स्थायी मरम्मत मानना ठीक है?'),
  ('Can you use a digital multimeter to check voltage like in this example?', 'क्या आप इस उदाहरण की तरह डिजिटल मल्टीमीटर से वोल्टेज चेक कर सकते हैं?'),
  ('Have you installed PVC / CPVC pipe fittings like this?', 'क्या आपने इस तरह PVC / CPVC पाइप फिटिंग लगाई है?'),
  ('Should you shut off the water supply before changing a faucet or valve?', 'क्या नल या वाल्व बदलने से पहले पानी की सप्लाई बंद करनी चाहिए?'),
  ('Is it fine to leave a pipe joint leaking if the pressure feels low?', 'अगर दबाव कम लगे तो क्या पाइप जोड़ों से रिसाव छोड़ देना ठीक है?'),
  ('Do you know how to cut and join PVC pipe for drainage / supply lines?', 'क्या आप ड्रेनेज / सप्लाई लाइन के लिए PVC पाइप काटना और जोड़ना जानते हैं?'),
  ('Have you used an arc / stick (MMA/SMAW) welding machine before?', 'क्या आपने पहले आर्क / स्टिक (MMA/SMAW) वेल्डिंग मशीन इस्तेमाल की है?'),
  ('Must you wear a welding helmet and gloves while striking an arc?', 'क्या आर्क लगाते समय वेल्डिंग हेलमेट और दस्ताने पहनना जरूरी है?'),
  ('Is it safe to weld without checking cables / connections first?', 'क्या केबल / कनेक्शन जाँचे बिना वेल्डिंग करना सुरक्षित है?'),
  ('Can you strike an arc and lay a basic bead like in this demo?', 'क्या आप इस डेमो की तरह आर्क लगाकर बुनियादी बीड बना सकते हैं?'),
  ('Have you driven heavy vehicles / trucks as shown in this type of work?', 'क्या आपने इस तरह के काम में दिखाए गए भारी वाहन / ट्रक चलाए हैं?'),
  ('Should you always inspect brakes, lights and tyres before a long trip?', 'क्या लंबी यात्रा से पहले ब्रेक, लाइट और टायर हमेशा जाँचने चाहिए?'),
  ('Is it OK to drive when you feel drowsy if the road looks empty?', 'अगर सड़क खाली लगे तो क्या नींद आने पर भी गाड़ी चलाना ठीक है?'),
  ('Do you have a valid licence suitable for the vehicle class you drive?', 'क्या आपके पास जिस वर्ग का वाहन चलाते हैं उसके लिए वैध लाइसेंस है?'),
  ('Have you laid bricks / blocks with mortar like this?', 'क्या आपने इस तरह मोर्टार से ईंट / ब्लॉक बिछाए हैं?'),
  ('Do you know the common hand tools used for bricklaying?', 'क्या आप ईंट लगाने के सामान्य हाथ के औजार जानते हैं?'),
  ('Is it OK to build a wall without checking level and plumb?', 'क्या लेवल और प्लंब जाँचे बिना दीवार बनाना ठीक है?'),
  ('Have you mixed cement / mortar for masonry work on site?', 'क्या आपने साइट पर चिनाई के लिए सीमेंट / मोर्टार मिलाया है?'),
  ('Have you done basic carpentry / woodwork like measuring and cutting timber?', 'क्या आपने लकड़ी नापने और काटने जैसा बुनियादी बढ़ईगीरी काम किया है?'),
  ('Do you recognise common woodworking hand / power tools?', 'क्या आप लकड़ी के काम के आम हाथ / पावर टूल्स पहचानते हैं?'),
  ('Is it safe to use a circular saw without eye and hand protection?', 'क्या आँख और हाथ की सुरक्षा के बिना सर्कुलर आरा चलाना सुरक्षित है?'),
  ('Can you make a reliable corner / joint as shown in carpentry demos?', 'क्या आप बढ़ईगीरी डेमो में दिखाए गए भरोसेमंद कोने / जोड़ बना सकते हैं?'),
  ('Have you worked as a site helper supporting skilled trades?', 'क्या आपने कुशल कारीगरों के साथ साइट हेल्पर के रूप में काम किया है?'),
  ('Should you wear a helmet / PPE on an active construction site?', 'क्या सक्रिय निर्माण साइट पर हेलमेट / PPE पहनना चाहिए?'),
  ('Is it OK to stand under a suspended load while materials are lifted?', 'सामग्री उठाते समय क्या लटकते भार के नीचे खड़ा रहना ठीक है?'),
  ('Are you ready to follow supervisor instructions and site safety rules?', 'क्या आप सुपरवाइजर के निर्देश और साइट सुरक्षा नियम मानने को तैयार हैं?'),
  ('Have you worked on air-conditioning / HVAC units like this?', 'क्या आपने इस तरह के एयर-कंडीशनिंग / HVAC यूनिट पर काम किया है?'),
  ('Should refrigerant lines and electrical supply be handled only with proper training?', 'क्या रेफ्रिजरेंट लाइन और बिजली सप्लाई केवल सही प्रशिक्षण के साथ संभालनी चाहिए?'),
  ('Is it safe to open a live outdoor AC unit without isolating power?', 'क्या बिजली बंद किए बिना चालू आउटडोर AC यूनिट खोलना सुरक्षित है?'),
  ('Can you identify basic AC outdoor / indoor unit components on site?', 'क्या आप साइट पर AC आउटडोर / इंडोर यूनिट के बुनियादी हिस्से पहचान सकते हैं?'),
  ('Are you ready to relocate abroad for verified skilled work if selected?', 'चयन होने पर क्या आप सत्यापित कुशल काम के लिए विदेश जाने को तैयार हैं?'),
  ('Do you understand SafeWork does not allow unauthorized agent fees?', 'क्या आप समझते हैं कि SafeWork अनधिकृत एजेंट फीस की अनुमति नहीं देता?'),
  ('Will you share only truthful work experience and documents on your profile?', 'क्या आप प्रोफ़ाइल पर केवल सच्चा अनुभव और दस्तावेज़ साझा करेंगे?'),
  ('Are you medically fit and willing to complete skill checks for GCC placement?', 'क्या आप मेडिकली फिट हैं और GCC प्लेसमेंट के लिए स्किल चेक पूरा करने को तैयार हैं?')
) AS v(en, hi)
WHERE worker_skill_quiz_items.question = v.en;
