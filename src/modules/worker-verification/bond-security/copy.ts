export type EnHi = { en: string; hi: string };

export const BOND_SECURITY_COPY = {
  title: {
    en: 'Final Bond & Security Submission',
    hi: 'अंतिम बॉन्ड एवं सुरक्षा दस्तावेज़ जमा करें',
  } satisfies EnHi,
  intro: {
    en: 'Your required assessment and selection stages have been completed. Before proceeding to the next stage, please submit the required bond and security documents according to your state.',
    hi: 'आपकी आवश्यक screening, testing और selection प्रक्रिया पूरी हो चुकी है। अगले चरण में जाने से पहले अपने राज्य के अनुसार आवश्यक bond और security documents जमा करें।',
  } satisfies EnHi,
  objective: {
    en: 'Your assessment and selection process is complete. Complete the required bond and security documentation to proceed to the next stage.',
    hi: 'आपकी assessment और selection प्रक्रिया पूरी हो चुकी है। अगले चरण में जाने के लिए आवश्यक bond और security documents जमा करें।',
  } satisfies EnHi,
  registeredState: { en: 'Your Registered State', hi: 'आपका पंजीकृत राज्य' } satisfies EnHi,
  confirmState: {
    en: 'I confirm that my registered state is correct.',
    hi: 'मैं पुष्टि करता/करती हूं कि मेरा पंजीकृत राज्य सही है।',
  } satisfies EnHi,
  updateProfile: { en: 'Update Profile', hi: 'प्रोफ़ाइल अपडेट करें' } satisfies EnHi,
  missingState: {
    en: 'Your registered state is missing. Update your profile, then return here to continue.',
    hi: 'आपका पंजीकृत राज्य नहीं मिला। प्रोफ़ाइल अपडेट करें, फिर यहां लौटकर जारी रखें।',
  } satisfies EnHi,
  stampValueLabel: {
    en: 'Required Stamp Paper Value',
    hi: 'आपके राज्य के लिए न्यूनतम स्टाम्प पेपर मूल्य',
  } satisfies EnHi,
  stampBoxTitle: { en: 'Stamp Paper Requirement', hi: 'स्टाम्प पेपर आवश्यकता' } satisfies EnHi,
  stampBoxBody: {
    en: 'Please obtain the required stamp paper according to your registered state and execute the prescribed bond/document. Upload a clear scanned copy/photo through this portal and submit the original document through the designated courier process.',
    hi: 'अपने पंजीकृत राज्य के अनुसार आवश्यक स्टाम्प पेपर प्राप्त करें और निर्धारित बॉन्ड/दस्तावेज़ तैयार करें। इसकी साफ scanned copy/photo portal पर upload करें और original document निर्धारित courier प्रक्रिया के माध्यम से भेजें।',
  } satisfies EnHi,
  compliance: {
    en: 'Stamp paper values displayed here are based on the SafeWork configuration provided for each state/UT. Applicable stamp duty, document execution and enforceability may depend on the nature of the instrument and applicable law. Verify before execution.',
    hi: 'यहां दिखाए गए stamp paper values प्रत्येक राज्य/UT के लिए SafeWork द्वारा configured information पर आधारित हैं। लागू stamp duty, document execution और enforceability document के प्रकार तथा लागू कानून पर निर्भर कर सकती है। Execution से पहले verification करें।',
  } satisfies EnHi,
  uploadTitle: { en: 'Upload Stamp Paper / Bond', hi: 'स्टाम्प पेपर / बॉन्ड अपलोड करें' } satisfies EnHi,
  uploadHint: {
    en: 'Make sure all text, signatures, stamp details and document numbers are clearly visible.',
    hi: 'सुनिश्चित करें कि सभी text, signatures, stamp details और document numbers स्पष्ट रूप से दिखाई दें।',
  } satisfies EnHi,
  uploadRequired: {
    en: 'Required: front page and the complete bond/document. Prefer one PDF containing all pages.',
    hi: 'आवश्यक: सामने वाला पेज और पूरा bond/document. सभी पेज एक PDF में अपलोड करना बेहतर है।',
  } satisfies EnHi,
  formats: {
    en: 'Accepted: PDF, JPG, JPEG, PNG. Maximum 10 MB.',
    hi: 'स्वीकृत: PDF, JPG, JPEG, PNG. अधिकतम 10 MB.',
  } satisfies EnHi,
  uploadBond: { en: 'Upload Bond', hi: 'बॉन्ड अपलोड करें' } satisfies EnHi,
  uploaded: { en: 'Uploaded', hi: 'अपलोड हो गया' } satisfies EnHi,
  courierTitle: { en: 'Original Document Submission', hi: 'मूल दस्तावेज़ जमा करना' } satisfies EnHi,
  courierBody: {
    en: 'After uploading the document, courier the original signed bond/stamp paper to the SafeWork Global designated address.',
    hi: 'दस्तावेज़ upload करने के बाद signed original bond/stamp paper को SafeWork Global के निर्धारित पते पर courier करें।',
  } satisfies EnHi,
  courierCompany: { en: 'Courier Company', hi: 'कूरियर कंपनी' } satisfies EnHi,
  trackingNumber: { en: 'Tracking Number', hi: 'ट्रैकिंग नंबर' } satisfies EnHi,
  courierDate: { en: 'Courier Date', hi: 'कूरियर की तारीख' } satisfies EnHi,
  uploadReceipt: { en: 'Upload Courier Receipt', hi: 'Courier Receipt Upload करें' } satisfies EnHi,
  workerChequeTitle: { en: 'Worker Security Cheque', hi: 'Worker का Security Cheque' } satisfies EnHi,
  workerChequeBody: {
    en: 'Upload a clear image/scan of the security cheque as instructed in your applicable agreement.',
    hi: 'लागू agreement में दिए निर्देशों के अनुसार security cheque की साफ image/scan upload करें।',
  } satisfies EnHi,
  chequeHolder: { en: 'Cheque Holder Name', hi: 'चेक धारक का नाम' } satisfies EnHi,
  bankName: { en: 'Bank Name', hi: 'बैंक का नाम' } satisfies EnHi,
  chequeNumber: { en: 'Cheque Number', hi: 'चेक नंबर' } satisfies EnHi,
  chequeDate: { en: 'Cheque Date, if applicable', hi: 'चेक की तारीख, यदि लागू हो' } satisfies EnHi,
  chequeAmount: { en: 'Amount, if applicable', hi: 'राशि, यदि लागू हो' } satisfies EnHi,
  uploadCheque: { en: 'Upload Cheque Image', hi: 'चेक की छवि अपलोड करें' } satisfies EnHi,
  configuredAmount: {
    en: 'Required security amount (set in your agreement)',
    hi: 'आवश्यक security राशि (agreement में निर्धारित)',
  } satisfies EnHi,
  guarantorTitle: { en: 'Guarantor Security Cheque', hi: 'गारंटर का Security Cheque' } satisfies EnHi,
  guarantorName: { en: 'Guarantor Full Name', hi: 'गारंटर का पूरा नाम' } satisfies EnHi,
  relationship: { en: 'Relationship with Worker', hi: 'Worker से संबंध' } satisfies EnHi,
  mobile: { en: 'Mobile Number', hi: 'मोबाइल नंबर' } satisfies EnHi,
  address: { en: 'Address', hi: 'पता' } satisfies EnHi,
  guarantorDeclaration: {
    en: 'I confirm that I am the guarantor identified above and that the information submitted is accurate.',
    hi: 'मैं पुष्टि करता/करती हूं कि मैं ऊपर बताए गए worker का guarantor हूं और मेरे द्वारा दी गई जानकारी सही है।',
  } satisfies EnHi,
  sendOtp: { en: 'Send OTP', hi: 'OTP भेजें' } satisfies EnHi,
  verifyOtp: { en: 'Verify OTP', hi: 'OTP सत्यापित करें' } satisfies EnHi,
  otpVerified: { en: 'Guarantor Mobile Verified', hi: 'गारंटर मोबाइल सत्यापित' } satisfies EnHi,
  samePhoneBlocked: {
    en: 'Guarantor mobile cannot be the same as your mobile number.',
    hi: 'गारंटर का मोबाइल आपके मोबाइल नंबर के समान नहीं हो सकता।',
  } satisfies EnHi,
  checklistTitle: { en: 'FINAL DOCUMENT CHECKLIST', hi: 'अंतिम दस्तावेज़ चेकलिस्ट' } satisfies EnHi,
  checklist: {
    stampBondUploaded: { en: 'State-specific stamp paper / bond uploaded', hi: 'State-specific stamp paper / bond upload' },
    originalPrepared: { en: 'Original bond prepared for courier', hi: 'Original bond courier के लिए तैयार' },
    courierReceiptUploaded: { en: 'Courier receipt uploaded', hi: 'Courier receipt upload' },
    workerChequeUploaded: { en: 'Worker security cheque uploaded', hi: 'Worker security cheque upload' },
    guarantorDetailsSubmitted: { en: 'Guarantor details submitted', hi: 'Guarantor details submit' },
    guarantorChequeUploaded: { en: 'Guarantor security cheque uploaded', hi: 'Guarantor security cheque upload' },
    guarantorDeclarationAccepted: { en: 'Guarantor declaration accepted', hi: 'Guarantor declaration accepted' },
    guarantorOtpVerified: { en: 'Guarantor OTP verified, if required', hi: 'Guarantor OTP verified' },
  },
  declaration1: {
    en: 'I confirm that the documents and information submitted by me are genuine and belong to me/the identified guarantor. I understand that SafeWork Global may verify these documents before approving the next stage of my worker journey.',
    hi: 'मैं पुष्टि करता/करती हूं कि मेरे द्वारा जमा किए गए documents और information वास्तविक हैं और मेरे/पहचाने गए guarantor से संबंधित हैं। मैं समझता/समझती हूं कि SafeWork Global अगले चरण में approval देने से पहले इन documents को verify कर सकता है।',
  } satisfies EnHi,
  declaration2: {
    en: 'I understand that submission of these documents does not by itself guarantee employment, visa issuance or deployment.',
    hi: 'मैं समझता/समझती हूं कि इन documents को जमा करने मात्र से employment, visa issuance या deployment की guarantee नहीं मिलती।',
  } satisfies EnHi,
  submit: { en: 'Submit for Verification', hi: 'Verification के लिए Submit करें' } satisfies EnHi,
  submittedBanner: {
    en: 'Documents Submitted — Under Verification',
    hi: 'दस्तावेज़ जमा — Verification जारी है',
  } satisfies EnHi,
  resubmission: { en: 'Resubmission Required', hi: 'दोबारा जमा करना आवश्यक' } satisfies EnHi,
  originalReceived: {
    en: 'Original received. Ready for final deployment processing.',
    hi: 'मूल दस्तावेज़ प्राप्त। अंतिम deployment प्रक्रिया के लिए तैयार।',
  } satisfies EnHi,
  approvedWaitingOriginal: {
    en: 'Documents approved. Waiting for the original to be received.',
    hi: 'दस्तावेज़ स्वीकृत। मूल दस्तावेज़ प्राप्त होने की प्रतीक्षा।',
  } satisfies EnHi,
  downloadTemplate: { en: 'Download bond', hi: 'बॉन्ड डाउनलोड करें' } satisfies EnHi,
  courierTo: { en: 'Courier the signed original to:', hi: 'Signed original यहां courier करें:' } satisfies EnHi,
} as const;
