/* ═══════════════════════════════════════════════════════════════
   Safex i18n Engine (v2) — THREE languages: English · हिन्दी · ଓଡ଼ିଆ
   ─────────────────────────────────────────────────────────────
   • JSON-style dictionaries (Google Translate NAHI — pure local i18n)
   • common.hi  = en→हिन्दी  ·  common.or = en→ଓଡ଼ିଆ
   • Har page apna specific dict lang.js ke through add karta hai
   • NAYI LANGUAGE ADD KARNE KE LIYE (scalable):
       1. yahan common me naya lang block add karo
       2. lang.js me LANGS + NAMES me naam add karo
   ═══════════════════════════════════════════════════════════════ */
window.SAFEX_I18N = {
  /* ── language cycle order + names (lang.js isse button label leta hai) ── */
  langs: ["EN", "HI", "OR"],
  names: { EN: "English", HI: "हिन्दी", OR: "ଓଡ଼ିଆ" },

  common: {
    /* ── ENGLISH → हिन्दी ── */
    hi: {
      "Dashboard": "डैशबोर्ड", "Home": "होम", "Menu": "मेन्यू", "Settings": "सेटिंग्स",
      "Profile": "प्रोफ़ाइल", "Reports": "रिपोर्ट्स", "Notifications": "सूचनाएँ",
      "Search": "खोजें", "Back": "वापस", "More": "और", "All": "सभी", "None": "कोई नहीं",
      "Submit": "सबमिट करें", "Cancel": "रद्द करें", "Close": "बंद करें",
      "View": "देखें", "Download": "डाउनलोड करें", "Update": "अपडेट करें",
      "Delete": "हटाएँ", "Save": "सेव करें", "Print": "प्रिंट करें",
      "Login": "लॉगिन करें", "Logout": "लॉगआउट", "Sign out": "साइन आउट",
      "Edit": "संपादित करें", "Add": "जोड़ें", "Export": "एक्सपोर्ट करें",
      "Refresh": "रीफ्रेश करें", "Retry": "दोबारा कोशिश करें", "Continue": "आगे बढ़ें",
      "Open": "खुला", "Closed": "बंद", "In Progress": "चालू",
      "Pending": "लंबित", "Resolved": "सुलझा", "Verified": "सत्यापित",
      "Active": "सक्रिय", "Inactive": "निष्क्रिय", "New": "नया",
      "Completed": "पूर्ण", "Scheduled": "निर्धारित", "Cancelled": "रद्द",
      "Name": "नाम", "Email": "ईमेल", "Phone": "फोन", "Password": "पासवर्ड",
      "Username": "यूज़रनेम", "Date": "तारीख", "Time": "समय",
      "Location": "स्थान", "Department": "विभाग", "Status": "स्टेटस",
      "Description": "विवरण", "Notes": "टिप्पणियाँ", "Remarks": "टिप्पणी",
      "Details": "विवरण", "Actions": "कार्रवाई", "Action": "कार्रवाई",
      "Loading...": "लोड हो रहा है...", "Please wait...": "कृपया प्रतीक्षा करें...",
      "Error": "त्रुटि", "Success": "सफल", "Yes": "हाँ", "No": "नहीं", "OK": "ठीक है",
      "Update successfully": "अपडेट सफल", "Saved successfully": "सफलतापूर्वक सेव हुआ",
      "No records found": "कोई रिकॉर्ड नहीं मिला", "No data": "कोई डेटा नहीं",
      "Online": "ऑनलाइन", "Offline": "ऑफलाइन", "Connected": "कनेक्टेड",
      "Connection lost": "कनेक्शन टूट गया", "Try again": "फिर कोशिश करें",
      "Near Miss": "नियर मिस", "Hazard": "खतरा", "Incident": "घटना",
      "Safety": "सुरक्षा", "Report": "रिपोर्ट", "Training": "ट्रेनिंग",
      "PPE": "PPE", "Audit": "ऑडिट", "Employee": "कर्मचारी", "Worker": "वर्कर",
      "Plant": "प्लांट", "Site": "साइट", "Emergency": "आपातकालीन",
      "Grievance": "शिकायत", "Feedback": "फीडबैक", "Suggestion": "सुझाव",
      "Observation": "अवलोकन", "Inspection": "निरीक्षण", "Risk": "जोखिम",
      "Severity": "गंभीरता", "High": "उच्च", "Medium": "मध्यम", "Low": "कम",
      "Critical": "गंभीर", "Root Cause": "मूल कारण", "Corrective Action": "सुधारात्मक कार्रवाई",
      "Preventive Action": "निवारक कार्रवाई", "Investigation": "जाँच",
      "Toolbox Talk": "टूलबॉक्स टॉक", "Life Saving Rules": "जीवन रक्षक नियम",
      "Today": "आज", "Yesterday": "कल", "Tomorrow": "कल (आने वाला)",
      "This week": "इस हफ्ते", "This month": "इस महीने",
    },

    /* ── ENGLISH → ଓଡ଼ିଆ ── */
    or: {
      "Dashboard": "ଡ୍ୟାସବୋର୍ଡ", "Home": "ହୋମ", "Menu": "ମେନୁ", "Settings": "ସେଟିଂସ",
      "Profile": "ପ୍ରୋଫାଇଲ", "Reports": "ରିପୋର୍ଟ", "Notifications": "ସୂଚନା",
      "Search": "ଖୋଜନ୍ତୁ", "Back": "ପଛକୁ", "More": "ଅଧିକ", "All": "ସବୁ", "None": "କିଛି ନୁହେଁ",
      "Submit": "ଦାଖଲ କରନ୍ତୁ", "Cancel": "ବାତିଲ କରନ୍ତୁ", "Close": "ବନ୍ଦ କରନ୍ତୁ",
      "View": "ଦେଖନ୍ତୁ", "Download": "ଡାଉନଲୋଡ କରନ୍ତୁ", "Update": "ଅପଡେଟ କରନ୍ତୁ",
      "Delete": "ଡିଲିଟ କରନ୍ତୁ", "Save": "ସେଭ କରନ୍ତୁ", "Print": "ପ୍ରିଣ୍ଟ କରନ୍ତୁ",
      "Login": "ଲଗଇନ କରନ୍ତୁ", "Logout": "ଲଗଆଉଟ", "Sign out": "ସାଇନ ଆଉଟ",
      "Edit": "ଏଡିଟ କରନ୍ତୁ", "Add": "ଯୋଡନ୍ତୁ", "Export": "ଏକ୍ସପୋର୍ଟ କରନ୍ତୁ",
      "Refresh": "ରିଫ୍ରେସ କରନ୍ତୁ", "Retry": "ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ", "Continue": "ଆଗକୁ ବଢନ୍ତୁ",
      "Open": "ଖୋଲା", "Closed": "ବନ୍ଦ", "In Progress": "ଚାଲୁଛି",
      "Pending": "ବାକି ଅଛି", "Resolved": "ସମାଧାନ ହେଲା", "Verified": "ଯାଞ୍ଚ ହେଲା",
      "Active": "ସକ୍ରିୟ", "Inactive": "ନିଷ୍କ୍ରିୟ", "New": "ନୂଆ",
      "Completed": "ସମ୍ପୂର୍ଣ୍ଣ", "Scheduled": "ନିର୍ଦ୍ଧାରିତ", "Cancelled": "ବାତିଲ",
      "Name": "ନାମ", "Email": "ଇମେଲ", "Phone": "ଫୋନ", "Password": "ପାସୱାର୍ଡ",
      "Username": "ୟୁଜରନେମ", "Date": "ତାରିଖ", "Time": "ସମୟ",
      "Location": "ସ୍ଥାନ", "Department": "ବିଭାଗ", "Status": "ସ୍ଥିତି",
      "Description": "ବିବରଣୀ", "Notes": "ନୋଟ", "Remarks": "ଟିପ୍ପଣୀ",
      "Details": "ବିବରଣୀ", "Actions": "କାର୍ଯ୍ୟ", "Action": "କାର୍ଯ୍ୟ",
      "Loading...": "ଲୋଡ ହେଉଛି...", "Please wait...": "ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ...",
      "Error": "ତ୍ରୁଟି", "Success": "ସଫଳ", "Yes": "ହଁ", "No": "ନା", "OK": "ଠିକ ଅଛି",
      "Update successfully": "ଅପଡେଟ ସଫଳ ହେଲା", "Saved successfully": "ସଫଳତାର ସହ ସେଭ ହେଲା",
      "No records found": "କୌଣସି ରେକର୍ଡ ମିଳିଲା ନାହିଁ", "No data": "କୌଣସି ଡାଟା ନାହିଁ",
      "Online": "ଅନଲାଇନ", "Offline": "ଅଫଲାଇନ", "Connected": "ସଂଯୋଗ ହେଲା",
      "Connection lost": "ସଂଯୋଗ ଛିଡିଗଲା", "Try again": "ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ",
      "Near Miss": "ନିୟର ମିସ", "Hazard": "ବିପଦ", "Incident": "ଘଟଣା",
      "Safety": "ସୁରକ୍ଷା", "Report": "ରିପୋର୍ଟ", "Training": "ତାଲିମ",
      "PPE": "PPE", "Audit": "ଅଡିଟ", "Employee": "କର୍ମଚାରୀ", "Worker": "ଶ୍ରମିକ",
      "Plant": "ପ୍ଲାଣ୍ଟ", "Site": "ସାଇଟ", "Emergency": "ଜରୁରୀକାଳୀନ",
      "Grievance": "ଅଭିଯୋଗ", "Feedback": "ମତାମତ", "Suggestion": "ପରାମର୍ଶ",
      "Observation": "ପର୍ଯ୍ୟବେକ୍ଷଣ", "Inspection": "ନିରୀକ୍ଷଣ", "Risk": "ବିପଦ",
      "Severity": "ଗମ୍ଭୀରତା", "High": "ଉଚ୍ଚ", "Medium": "ମଧ୍ୟମ", "Low": "କମ",
      "Critical": "ଗୁରୁତର", "Root Cause": "ମୂଳ କାରଣ", "Corrective Action": "ସଂଶୋଧନ କାର୍ଯ୍ୟ",
      "Preventive Action": "ପ୍ରତିଷେଧକ କାର୍ଯ୍ୟ", "Investigation": "ତଦନ୍ତ",
      "Toolbox Talk": "ଟୁଲବକ୍ସ ଟକ", "Life Saving Rules": "ଜୀବନ ରକ୍ଷା ନିୟମ",
      "Today": "ଆଜି", "Yesterday": "ଗତକାଲି", "Tomorrow": "ଆସନ୍ତାକାଲି",
      "This week": "ଏହି ସପ୍ତାହ", "This month": "ଏହି ମାସ",
    }
  }
};
