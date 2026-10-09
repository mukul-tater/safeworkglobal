-- Replace the bike parcel (Delivery) Test 1 paper with the road-safety,
-- delivery-handling and customer-service screening questions.
-- Pass mark is 7/10 (70). Other trades stay at 60.

INSERT INTO public.skill_quiz_configs
  (skill_code, region, questions_to_show, selection_mode, selected_ids, pass_score, active)
SELECT 'Delivery', NULL, 10, 'random_active', '{}'::uuid[], 70, true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.skill_quiz_configs c
  WHERE c.skill_code = 'Delivery'
    AND c.region IS NULL
);

UPDATE public.skill_quiz_configs
SET questions_to_show = 10,
    pass_score = 70,
    selection_mode = 'random_active',
    selected_ids = '{}'::uuid[],
    active = true,
    updated_at = now()
WHERE region IS NULL
  AND skill_code = 'Delivery';

DELETE FROM public.worker_skill_quiz_responses
WHERE quiz_item_id IN (
  SELECT id
  FROM public.worker_skill_quiz_items
  WHERE skill_code = 'Delivery'
);

DELETE FROM public.worker_skill_quiz_items
WHERE skill_code = 'Delivery';

INSERT INTO public.worker_skill_quiz_items
  (skill_code, question, question_hi, options, correct_option, sort_order)
VALUES
  ('Delivery', 'What should you do before starting a delivery ride?', 'डिलीवरी के लिए निकलने से पहले आपको क्या करना चाहिए?', '[{"id":"A","en":"Check the bike, brakes and tyres","hi":"बाइक, ब्रेक और टायर चेक करें"},{"id":"B","en":"Ride as fast as possible","hi":"जितना हो सके तेज़ चलें"},{"id":"C","en":"Ignore the fuel level","hi":"फ्यूल लेवल को नज़रअंदाज़ करें"},{"id":"D","en":"Use the phone while riding","hi":"बाइक चलाते समय फोन इस्तेमाल करें"}]'::jsonb, 'A', 1),
  ('Delivery', 'What should you do at a red traffic signal?', 'लाल ट्रैफिक सिग्नल पर आपको क्या करना चाहिए?', '[{"id":"A","en":"Speed up and cross","hi":"तेज़ चलाकर निकल जाएँ"},{"id":"B","en":"Stop before the signal line","hi":"सिग्नल लाइन से पहले रुकें"},{"id":"C","en":"Follow the vehicle ahead without checking","hi":"बिना देखे आगे वाली गाड़ी के पीछे चलें"},{"id":"D","en":"Sound the horn and cross","hi":"हॉर्न बजाकर निकल जाएँ"}]'::jsonb, 'B', 2),
  ('Delivery', 'Why must you wear a properly fastened helmet?', 'सही तरीके से हेलमेट पहनना क्यों ज़रूरी है?', '[{"id":"A","en":"To avoid carrying documents","hi":"दस्तावेज़ रखने से बचने के लिए"},{"id":"B","en":"To ride faster","hi":"तेज़ चलाने के लिए"},{"id":"C","en":"To protect your head in a crash","hi":"दुर्घटना में सिर की सुरक्षा के लिए"},{"id":"D","en":"Only to look professional","hi":"सिर्फ अच्छा दिखने के लिए"}]'::jsonb, 'C', 3),
  ('Delivery', 'If your phone rings while riding, what should you do?', 'बाइक चलाते समय फोन बजे तो क्या करना चाहिए?', '[{"id":"A","en":"Answer while riding","hi":"चलाते समय फोन उठाएँ"},{"id":"B","en":"Look down at the screen","hi":"स्क्रीन देखकर पढ़ें"},{"id":"C","en":"Ride with one hand and answer","hi":"एक हाथ से बाइक चलाकर बात करें"},{"id":"D","en":"Stop safely in an appropriate place before responding","hi":"सुरक्षित जगह पर रुककर जवाब दें"}]'::jsonb, 'D', 4),
  ('Delivery', 'What should you do if you cannot find the customer''s address?', 'ग्राहक का पता न मिले तो क्या करना चाहिए?', '[{"id":"A","en":"Stop safely and check the approved navigation or contact method","hi":"सुरक्षित जगह रुककर नेविगेशन या संपर्क का सही तरीका देखें"},{"id":"B","en":"Ride randomly through the area","hi":"इलाके में बिना दिशा के घूमते रहें"},{"id":"C","en":"Leave the order anywhere","hi":"ऑर्डर कहीं भी छोड़ दें"},{"id":"D","en":"Ignore the delivery","hi":"डिलीवरी को नज़रअंदाज़ करें"}]'::jsonb, 'A', 5),
  ('Delivery', 'What should you do if a food package is damaged before delivery?', 'डिलीवरी से पहले खाने का पैकेट खराब हो जाए तो क्या करना चाहिए?', '[{"id":"A","en":"Deliver it without telling anyone","hi":"बिना बताए डिलीवर कर दें"},{"id":"B","en":"Report it according to company procedure","hi":"कंपनी की प्रक्रिया के अनुसार रिपोर्ट करें"},{"id":"C","en":"Hide the damage","hi":"नुकसान छिपाएँ"},{"id":"D","en":"Throw it away without informing anyone","hi":"बिना बताए फेंक दें"}]'::jsonb, 'B', 6),
  ('Delivery', 'What should you do if you are running late for a delivery?', 'डिलीवरी में देर हो रही हो तो क्या करना चाहिए?', '[{"id":"A","en":"Break traffic rules to save time","hi":"समय बचाने के लिए ट्रैफिक नियम तोड़ें"},{"id":"B","en":"Drive on the wrong side","hi":"गलत दिशा में चलें"},{"id":"C","en":"Inform the dispatcher or customer through the approved process","hi":"निर्धारित तरीके से डिस्पैचर या ग्राहक को सूचित करें"},{"id":"D","en":"Stop accepting instructions","hi":"निर्देश लेना बंद कर दें"}]'::jsonb, 'C', 7),
  ('Delivery', 'What should you do if it is raining and the road is slippery?', 'बारिश में सड़क फिसलन भरी हो तो क्या करना चाहिए?', '[{"id":"A","en":"Brake suddenly at all times","hi":"हर समय अचानक ब्रेक लगाएँ"},{"id":"B","en":"Increase speed","hi":"गति बढ़ाएँ"},{"id":"C","en":"Follow other bikes very closely","hi":"दूसरी बाइक के बहुत पास चलें"},{"id":"D","en":"Reduce speed and increase following distance","hi":"गति कम करें और सुरक्षित दूरी बढ़ाएँ"}]'::jsonb, 'D', 8),
  ('Delivery', 'How should you handle a customer who complains about a late order?', 'देर से पहुँचे ऑर्डर की शिकायत करने वाले ग्राहक से कैसे बात करें?', '[{"id":"A","en":"Stay calm and respond politely","hi":"शांत रहकर विनम्रता से जवाब दें"},{"id":"B","en":"Argue loudly","hi":"ज़ोर से बहस करें"},{"id":"C","en":"Blame the customer","hi":"ग्राहक को दोष दें"},{"id":"D","en":"Leave without responding","hi":"बिना जवाब दिए चले जाएँ"}]'::jsonb, 'A', 9),
  ('Delivery', 'What should you do after completing a delivery?', 'डिलीवरी पूरी करने के बाद क्या करना चाहिए?', '[{"id":"A","en":"Keep the order marked as pending","hi":"ऑर्डर को पेंडिंग रहने दें"},{"id":"B","en":"Confirm delivery in the app or approved system","hi":"ऐप या निर्धारित सिस्टम में डिलीवरी कन्फर्म करें"},{"id":"C","en":"Delete the delivery record","hi":"डिलीवरी रिकॉर्ड मिटा दें"},{"id":"D","en":"Mark another order as delivered","hi":"किसी दूसरे ऑर्डर को डिलीवर मार्क करें"}]'::jsonb, 'B', 10);
