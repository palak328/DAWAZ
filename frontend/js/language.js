
/* ============================================
   DAWAZ - SHARED ENGLISH / HINDI LANGUAGE SYSTEM
============================================ */

(function () {
    "use strict";

    const LANGUAGE_KEY = "dawazLanguage";
    const DEFAULT_LANGUAGE = "en";

    let currentLanguage =
        localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;

    const translations = {

        /* ============================================
           ENGLISH
        ============================================ */

        en: {

            // NAVIGATION
            dashboard: "Dashboard",
            medicines: "My Medicines",
            reminders: "Reminders",
            scanner: "Scan Medicine",
            caregivers: "Caregivers",
            patient: "Patient",
            prescription: "Prescription",

            // DASHBOARD
            greeting: "PATIENT DASHBOARD",
            welcome: "Welcome back!",
            welcomeDescription:
                "Manage your medicines, follow your schedule and keep your daily health routine organised.",
            dailyOverview: "YOUR DAILY OVERVIEW",
            atGlance: "AT A GLANCE",
            overview: "Your Overview",
            nextReminder: "NEXT REMINDER",
            medicineReminder: "Medicine reminder",
            todaysMedicines: "TODAY'S MEDICINES",
            scheduledDoses: "Scheduled doses",
            medicineStock: "MEDICINE STOCK",
            unitsRemaining: "Units remaining",
            dailyTracker: "DAILY TRACKER",
            medicineSchedule: "Today's Medicine Schedule",
            scheduleDescription: "Keep track of your scheduled doses.",
            viewAll: "View All →",
            todaysProgress: "Today's Progress",
            progressNote:
                "Progress is based on doses reported as taken by the patient.",
            upcoming: "Upcoming",
            markTaken: "Mark as taken",
            shortcuts: "SHORTCUTS",
            quickActions: "Quick Actions",
            quickActionsDescription: "Access important features.",
            scanMedicine: "Scan Medicine",
            scanDescription: "Identify and check a medicine",
            askDawaz: "Ask DAWAZ",
            askDescription: "Get medicine information and assistance",
            uploadPrescription: "Upload Prescription",
            uploadDescription: "Submit a prescription for review",
            medicineSafety: "Medicine Safety",
            safetyDescription:
                "Follow your confirmed prescription for medicine timing and instructions. If you are unsure about a medicine or dose, consult your doctor or pharmacist.",

            // MY MEDICINES
            myMedicines: "My Medicines",
            manageMedicines:
                "Manage your medicine records and monitor your stock.",
            addMedicine: "+ Add Medicine",
            totalMedicines: "Total Medicines",
            lowStock: "Low Stock",
            outOfStock: "Out of Stock",
            searchMedicines: "Search medicines by name or strength...",
            noMedicines: "No medicines added yet",
            emptyMedicineDescription:
                "Add your medicines to maintain a digital medicine cabinet.",
            addFirstMedicine: "+ Add Your First Medicine",
            addMedicineTitle: "Add Medicine",
            close: "Close",
            medicineName: "Medicine Name",
            enterMedicineName: "Enter medicine name",
            strength: "Strength",
            enterStrength: "Enter prescribed strength",
            availableStock: "Available Stock",
            enterQuantity: "Enter available quantity",
            prescriptionInstructions: "Prescription Instructions",
            enterPrescriptionInstructions:
                "Enter instructions from the confirmed prescription",
            additionalNotes: "Additional Notes",
            enterAdditionalNotes: "Enter additional notes",
            cancel: "Cancel",
            saveMedicine: "Save Medicine",
            medicineSafetyDescription:
                "Always follow your confirmed doctor's prescription. DAWAZ does not independently recommend or change medicine doses.",

            // REMINDERS PAGE
            medicationManagement: "MEDICATION MANAGEMENT",
            medicineReminders: "Medicine Reminders",
            reminderPageDescription:
                "Keep track of your medicine schedule and record your daily medication updates.",
            addReminder: "+ Add Reminder",
            todaysReminders: "Today's Reminders",
            scheduledReminders: "Scheduled reminders",
            completed: "Completed",
            patientReportedTaken: "Patient reported taken",
            remainingReminders: "Remaining reminders",
            todaysSchedule: "Today's Schedule",
            dailySchedule: "Daily Schedule",
            noReminders: "No reminders added yet",
            remindersWillAppear:
                "Your medicine reminders will appear here.",
            reminderHistory: "Reminder History",
            historyDescription:
                "Review your previously recorded medicine updates.",
            emptyHistory:
                "Your reminder history will appear here.",
            historyNote:
                "Taken status records the patient's response. It does not independently verify that medicine was taken.",
            personalMedicationSchedule: "PERSONAL MEDICATION SCHEDULE",
            addMedicineReminder: "Add Medicine Reminder",
            enterConfirmedMedicine: "Enter confirmed medicine name",
            reminderTime: "Reminder Time",
            frequency: "Frequency",
            selectFrequency: "Select frequency",
            onceDaily: "Once daily",
            twiceDaily: "Twice daily",
            threeTimesDaily: "Three times daily",
            custom: "Custom",
            instructionsOptional: "Instructions (Optional)",
            reminderFormSafety:
                "Enter only the timing and instructions confirmed by your doctor or prescription.",
            saveReminder: "Save Reminder",
            reminderSafetyDescription:
                "Reminder schedules should follow your confirmed prescription. If a dose is missed or you are unsure what to do, consult your doctor or pharmacist.",

            // MEDICINE SCANNER PAGE
            scannerEyebrow: "SMART MEDICINE IDENTIFICATION",
            medicineScanner: "Medicine Scanner",
            scannerDescription:
                "Scan or upload a medicine image to get identification assistance.",
            scanGuidance: "For a clearer scan",
            scanGuidanceDescription:
                "Follow these tips for a better image.",
            goodLighting: "Good lighting",
            goodLightingDescription:
                "Keep the medicine in a well-lit area.",
            clearFocus: "Clear focus",
            clearFocusDescription:
                "Keep the camera steady and the text readable.",
            showPackaging: "Show the packaging",
            showPackagingDescription:
                "Include the medicine name and available details.",
            scanMedicineOrPrescription:
                "Scan Medicine or Prescription",
            scannerHeaderDescription:
                "Use your camera or upload an image for identification assistance.",
            cameraPreview: "Camera Preview",
            cameraPreviewDescription:
                "Your camera preview will appear here.",
            startCamera: "Start Camera",
            captureImage: "Capture Image",
            or: "OR",
            uploadImage: "Upload Image",
            uploadImageDescription:
                "Choose an image from your device.",
            selectedImage: "Selected Image",
            selectedImageAlt: "Selected medicine image",
            removeImage: "Remove Image",
            identifyMedicine: "Identify Medicine",
            identificationResult: "Identification Result",
            identificationAssistance: "IDENTIFICATION ASSISTANCE",
            identifyYourMedicine: "Help identify your medicine",
            identificationHelpDescription:
                "Provide any additional information you can read from the packaging.",
            additionalInformation: "Additional Information",
            additionalInformationPlaceholder:
                "Enter any visible medicine name or details...",
            submitAnswers: "Submit Information",
            retakeImage: "Scan Another Image",
            clarificationSafety:
                "Do not use an uncertain scan result to decide which medicine to take. Confirm the medicine with your prescription, doctor or pharmacist.",
            medicineAssistant: "Medicine Assistant",
            talkAboutMedicine: "Ask about your medicine",
            medicineChatDescription:
                "Ask general questions about medicine information.",
            chatInitialStatus: "Ready to help",
            conversationLabel: "Conversation",
            medicineQuestionPlaceholder:
                "Type your medicine-related question...",
            medicineQuestionLabel: "Your question",
            startVoiceInput: "Start voice input",
            speakQuestion: "Speak your question",
            send: "Send",
            chatSafety:
                "DAWAZ does not replace advice from your doctor or pharmacist.",
            importantSafety: "Important Safety Information",
            scannerSafetyDescription:
                "Scan results may be incomplete or incorrect. Always verify medicine details against your confirmed prescription or with a healthcare professional.",

            // ASK DAWAZ PAGE
            medicineAssistantLabel: "YOUR MEDICINE ASSISTANT",
            askPageDescription:
                "Have a question about your medicines? DAWAZ can help you understand your saved medicine information and prescription records.",
            backDashboard: "← Back to Dashboard",
            dawazAssistant: "DAWAZ Assistant",
            medicineInformationSupport: "Medicine Information Support",
            readyToHelp: "Ready to help",
            conversationWithDawaz: "Conversation with DAWAZ",
            welcomeAsk:
                "Hello! I'm your DAWAZ medicine assistant.",
            welcomeAskDescription:
                "I can help you understand information from your saved medicine records.",
            whatWouldYouLikeToKnow:
                "What would you like to know?",
            youCanAskAbout: "You can ask me about",
            typeMedicineQuestion:
                "Type your medicine-related question",
            askDawazPlaceholder:
                "Ask DAWAZ something about your medicines...",
            sendMessage: "Send message",
            chatInputHint:
                "Press Enter to send · Shift + Enter for a new line",

            // PRESCRIPTION PAGE
            medicineManagement: "Medicine Management",
            prescriptionPageDescription:
                "Upload your doctor's prescription to keep your medicine records organised.",
            uploadYourPrescription: "Upload Your Prescription",
            selectPrescriptionFile:
                "Select a prescription image or PDF from your device.",
            chooseFile: "Choose File",
            submitPrescription: "Submit Prescription",
            supportedFormats: "Supported formats: JPG, PNG and PDF",
            maximumFileSize: "Maximum file size: 10 MB",
            extractedMedicineDetails: "Extracted Medicine Details",
            detectedPrescriptionInformation:
                "Information detected from your prescription",
            medicineDetailsWillAppear:
                "Medicine details will appear here after prescription scanning.",
            ocrNotConnected: "OCR processing not connected yet",
            notAvailable: "Not available",
            doctorsInstructions: "Doctor's Instructions",
            verifyExtractedInformation:
                "Always verify extracted information against your original prescription.",
            prescriptionStatus: "Prescription Status",
            trackPrescriptionProgress:
                "Track your prescription progress",
            prescriptionUploaded: "Prescription Uploaded",
            waitingForSubmission: "Waiting for document submission",
            medicineDetailsExtraction: "Medicine Details Extraction",
            ocrProcessingNotConnected: "OCR processing not connected",
            patientReview: "Patient Review",
            verifyBeforeConfirmation:
                "Verify details before confirmation",
            noPrescriptionSubmitted: "No prescription submitted",
            importantSafetyInformation: "Important Safety Information",
            prescriptionSafetyDescription:
                "DAWAZ does not independently decide medicine dosage or frequency. Always follow your doctor's confirmed prescription. If any medicine name or instruction is unclear, consult your doctor or pharmacist."
        },


        /* ============================================
           HINDI
        ============================================ */

        hi: {

            // NAVIGATION
            dashboard: "डैशबोर्ड",
            medicines: "मेरी दवाइयाँ",
            reminders: "रिमाइंडर",
            scanner: "दवाई स्कैन करें",
            caregivers: "देखभालकर्ता",
            patient: "मरीज़",
            prescription: "डॉक्टर का पर्चा",

            // DASHBOARD
            greeting: "मरीज़ का डैशबोर्ड",
            welcome: "वापस स्वागत है!",
            welcomeDescription:
                "अपनी दवाइयों को मैनेज करें, समय-सारणी का पालन करें और अपनी दैनिक स्वास्थ्य दिनचर्या व्यवस्थित रखें।",
            dailyOverview: "आपका दैनिक विवरण",
            atGlance: "एक नज़र में",
            overview: "आपका विवरण",
            nextReminder: "अगला रिमाइंडर",
            medicineReminder: "दवाई का रिमाइंडर",
            todaysMedicines: "आज की दवाइयाँ",
            scheduledDoses: "निर्धारित खुराकें",
            medicineStock: "दवाइयों का स्टॉक",
            unitsRemaining: "बाकी मात्रा",
            dailyTracker: "दैनिक ट्रैकर",
            medicineSchedule: "आज की दवाई समय-सारणी",
            scheduleDescription:
                "अपनी निर्धारित खुराकों पर नज़र रखें।",
            viewAll: "सभी देखें →",
            todaysProgress: "आज की प्रगति",
            progressNote:
                "प्रगति मरीज़ द्वारा दवाई लेने की दी गई जानकारी पर आधारित है।",
            upcoming: "आने वाली",
            markTaken: "ली गई के रूप में चिह्नित करें",
            shortcuts: "शॉर्टकट",
            quickActions: "त्वरित विकल्प",
            quickActionsDescription:
                "महत्वपूर्ण सुविधाओं तक पहुँचें।",
            scanMedicine: "दवाई स्कैन करें",
            scanDescription: "दवाई की पहचान और जाँच करें",
            askDawaz: "DAWAZ से पूछें",
            askDescription:
                "दवाई की जानकारी और सहायता प्राप्त करें",
            uploadPrescription: "पर्चा अपलोड करें",
            uploadDescription:
                "जाँच के लिए डॉक्टर का पर्चा जमा करें",
            medicineSafety: "दवाई सुरक्षा",
            safetyDescription:
                "दवाई के समय और निर्देशों के लिए अपने पुष्ट डॉक्टर के पर्चे का पालन करें। किसी दवाई या खुराक को लेकर संदेह होने पर डॉक्टर या फार्मासिस्ट से सलाह लें।",

            // MY MEDICINES
            myMedicines: "मेरी दवाइयाँ",
            manageMedicines:
                "अपनी दवाइयों का रिकॉर्ड और स्टॉक मैनेज करें।",
            addMedicine: "+ दवाई जोड़ें",
            totalMedicines: "कुल दवाइयाँ",
            lowStock: "कम स्टॉक",
            outOfStock: "स्टॉक समाप्त",
            searchMedicines: "नाम या स्ट्रेंथ से दवाई खोजें...",
            noMedicines: "अभी तक कोई दवाई नहीं जोड़ी गई",
            emptyMedicineDescription:
                "अपनी डिजिटल दवाई कैबिनेट बनाने के लिए दवाइयाँ जोड़ें।",
            addFirstMedicine: "+ अपनी पहली दवाई जोड़ें",
            addMedicineTitle: "दवाई जोड़ें",
            close: "बंद करें",
            medicineName: "दवाई का नाम",
            enterMedicineName: "दवाई का नाम दर्ज करें",
            strength: "स्ट्रेंथ",
            enterStrength: "निर्धारित स्ट्रेंथ दर्ज करें",
            availableStock: "उपलब्ध स्टॉक",
            enterQuantity: "उपलब्ध मात्रा दर्ज करें",
            prescriptionInstructions: "पर्चे के निर्देश",
            enterPrescriptionInstructions:
                "पुष्ट पर्चे के निर्देश दर्ज करें",
            additionalNotes: "अतिरिक्त नोट्स",
            enterAdditionalNotes: "अतिरिक्त जानकारी दर्ज करें",
            cancel: "रद्द करें",
            saveMedicine: "दवाई सेव करें",
            medicineSafetyDescription:
                "हमेशा अपने डॉक्टर के पुष्ट पर्चे का पालन करें। DAWAZ स्वयं दवाइयों की खुराक की सलाह या बदलाव नहीं करता।",

            // REMINDERS PAGE
            medicationManagement: "दवाई प्रबंधन",
            medicineReminders: "दवाई के रिमाइंडर",
            reminderPageDescription:
                "अपनी दवाई की समय-सारणी पर नज़र रखें और रोज़ाना दवाई से जुड़ी जानकारी दर्ज करें।",
            addReminder: "+ रिमाइंडर जोड़ें",
            todaysReminders: "आज के रिमाइंडर",
            scheduledReminders: "निर्धारित रिमाइंडर",
            completed: "पूरे हुए",
            patientReportedTaken:
                "मरीज़ ने दवाई लेने की जानकारी दी",
            remainingReminders: "बाकी रिमाइंडर",
            todaysSchedule: "आज की समय-सारणी",
            dailySchedule: "दैनिक समय-सारणी",
            noReminders:
                "अभी तक कोई रिमाइंडर नहीं जोड़ा गया",
            remindersWillAppear:
                "आपके दवाई के रिमाइंडर यहाँ दिखाई देंगे।",
            reminderHistory: "रिमाइंडर का इतिहास",
            historyDescription:
                "पहले दर्ज की गई दवाई से जुड़ी जानकारी देखें।",
            emptyHistory:
                "आपके रिमाइंडर का इतिहास यहाँ दिखाई देगा।",
            historyNote:
                "दवाई ली गई स्थिति मरीज़ की दी गई जानकारी दर्ज करती है। यह स्वतंत्र रूप से पुष्टि नहीं करती कि दवाई वास्तव में ली गई थी।",
            personalMedicationSchedule:
                "व्यक्तिगत दवाई समय-सारणी",
            addMedicineReminder: "दवाई का रिमाइंडर जोड़ें",
            enterConfirmedMedicine:
                "पुष्ट दवाई का नाम दर्ज करें",
            reminderTime: "रिमाइंडर का समय",
            frequency: "कितनी बार",
            selectFrequency: "समय की आवृत्ति चुनें",
            onceDaily: "दिन में एक बार",
            twiceDaily: "दिन में दो बार",
            threeTimesDaily: "दिन में तीन बार",
            custom: "अन्य",
            instructionsOptional: "निर्देश (वैकल्पिक)",
            reminderFormSafety:
                "केवल वही समय और निर्देश दर्ज करें जिनकी पुष्टि आपके डॉक्टर या पर्चे में की गई है।",
            saveReminder: "रिमाइंडर सेव करें",
            reminderSafetyDescription:
                "रिमाइंडर की समय-सारणी आपके पुष्ट पर्चे के अनुसार होनी चाहिए। यदि कोई खुराक छूट जाए या आपको समझ न आए कि क्या करना है, तो अपने डॉक्टर या फार्मासिस्ट से सलाह लें।",

            // MEDICINE SCANNER PAGE
            scannerEyebrow: "स्मार्ट दवाई पहचान",
            medicineScanner: "दवाई स्कैनर",
            scannerDescription:
                "दवाई की पहचान में सहायता पाने के लिए उसकी तस्वीर स्कैन करें या अपलोड करें।",
            scanGuidance: "बेहतर स्कैन के लिए",
            scanGuidanceDescription:
                "अच्छी तस्वीर के लिए इन सुझावों का पालन करें।",
            goodLighting: "अच्छी रोशनी",
            goodLightingDescription:
                "दवाई को अच्छी रोशनी वाली जगह पर रखें।",
            clearFocus: "साफ़ फोकस",
            clearFocusDescription:
                "कैमरे को स्थिर रखें और लिखावट साफ़ दिखाएँ।",
            showPackaging: "पैकेजिंग दिखाएँ",
            showPackagingDescription:
                "दवाई का नाम और उपलब्ध जानकारी तस्वीर में शामिल करें।",
            scanMedicineOrPrescription:
                "दवाई या पर्चा स्कैन करें",
            scannerHeaderDescription:
                "पहचान में सहायता पाने के लिए कैमरे का उपयोग करें या तस्वीर अपलोड करें।",
            cameraPreview: "कैमरा प्रीव्यू",
            cameraPreviewDescription:
                "आपके कैमरे की तस्वीर यहाँ दिखाई देगी।",
            startCamera: "कैमरा शुरू करें",
            captureImage: "तस्वीर लें",
            or: "या",
            uploadImage: "तस्वीर अपलोड करें",
            uploadImageDescription:
                "अपने डिवाइस से तस्वीर चुनें।",
            selectedImage: "चुनी गई तस्वीर",
            selectedImageAlt: "चुनी गई दवाई की तस्वीर",
            removeImage: "तस्वीर हटाएँ",
            identifyMedicine: "दवाई की पहचान करें",
            identificationResult: "पहचान का परिणाम",
            identificationAssistance: "पहचान में सहायता",
            identifyYourMedicine:
                "अपनी दवाई की पहचान में सहायता पाएँ",
            identificationHelpDescription:
                "पैकेजिंग पर दिखाई देने वाली कोई अतिरिक्त जानकारी दर्ज करें।",
            additionalInformation: "अतिरिक्त जानकारी",
            additionalInformationPlaceholder:
                "दवाई का दिखाई देने वाला नाम या अन्य जानकारी लिखें...",
            submitAnswers: "जानकारी जमा करें",
            retakeImage: "दूसरी तस्वीर स्कैन करें",
            clarificationSafety:
                "अनिश्चित स्कैन परिणाम के आधार पर यह तय न करें कि कौन-सी दवाई लेनी है। पर्चे, डॉक्टर या फार्मासिस्ट से दवाई की पुष्टि करें।",
            medicineAssistant: "दवाई सहायक",
            talkAboutMedicine: "अपनी दवाई के बारे में पूछें",
            medicineChatDescription:
                "दवाई से जुड़ी सामान्य जानकारी के बारे में सवाल पूछें।",
            chatInitialStatus: "सहायता के लिए तैयार",
            conversationLabel: "बातचीत",
            medicineQuestionPlaceholder:
                "दवाई से जुड़ा अपना सवाल लिखें...",
            medicineQuestionLabel: "आपका सवाल",
            startVoiceInput: "आवाज़ से लिखना शुरू करें",
            speakQuestion: "अपना सवाल बोलें",
            send: "भेजें",
            chatSafety:
                "DAWAZ आपके डॉक्टर या फार्मासिस्ट की सलाह का विकल्प नहीं है।",
            importantSafety: "महत्वपूर्ण सुरक्षा जानकारी",
            scannerSafetyDescription:
                "स्कैन के परिणाम अधूरे या गलत हो सकते हैं। दवाई की जानकारी हमेशा अपने पुष्ट पर्चे या स्वास्थ्य विशेषज्ञ से जाँचें।",

            // ASK DAWAZ PAGE
            medicineAssistantLabel: "आपका दवाई सहायक",
            askPageDescription:
                "क्या आपको अपनी दवाइयों के बारे में कोई सवाल है? DAWAZ आपके सेव किए गए दवाई के रिकॉर्ड और डॉक्टर के पर्चे की जानकारी समझने में मदद कर सकता है।",
            backDashboard: "← डैशबोर्ड पर वापस जाएँ",
            dawazAssistant: "DAWAZ सहायक",
            medicineInformationSupport: "दवाई की जानकारी और सहायता",
            readyToHelp: "मदद के लिए तैयार",
            conversationWithDawaz: "DAWAZ के साथ बातचीत",
            welcomeAsk:
                "नमस्ते! मैं आपका DAWAZ दवाई सहायक हूँ।",
            welcomeAskDescription:
                "मैं आपके सेव किए गए दवाई के रिकॉर्ड की जानकारी समझने में मदद कर सकता हूँ।",
            whatWouldYouLikeToKnow:
                "आप क्या जानना चाहते हैं?",
            youCanAskAbout:
                "आप मुझसे इन विषयों के बारे में पूछ सकते हैं",
            typeMedicineQuestion:
                "अपनी दवाई से जुड़ा सवाल लिखें",
            askDawazPlaceholder:
                "अपनी दवाइयों के बारे में DAWAZ से पूछें...",
            sendMessage: "संदेश भेजें",
            chatInputHint:
                "भेजने के लिए Enter दबाएँ · नई लाइन के लिए Shift + Enter दबाएँ",

            // PRESCRIPTION PAGE
            medicineManagement: "दवाई प्रबंधन",
            prescriptionPageDescription:
                "अपनी दवाइयों का रिकॉर्ड व्यवस्थित रखने के लिए डॉक्टर का पर्चा अपलोड करें।",
            uploadYourPrescription: "अपना पर्चा अपलोड करें",
            selectPrescriptionFile:
                "अपने डिवाइस से पर्चे की तस्वीर या PDF चुनें।",
            chooseFile: "फाइल चुनें",
            submitPrescription: "पर्चा जमा करें",
            supportedFormats: "सपोर्ट किए जाने वाले फॉर्मेट: JPG, PNG और PDF",
            maximumFileSize: "अधिकतम फाइल साइज़: 10 MB",
            extractedMedicineDetails: "निकाली गई दवाई की जानकारी",
            detectedPrescriptionInformation:
                "आपके पर्चे से पहचानी गई जानकारी",
            medicineDetailsWillAppear:
                "पर्चा स्कैन होने के बाद दवाई की जानकारी यहाँ दिखाई देगी।",
            ocrNotConnected: "OCR प्रोसेसिंग अभी कनेक्ट नहीं है",
            notAvailable: "उपलब्ध नहीं",
            doctorsInstructions: "डॉक्टर के निर्देश",
            verifyExtractedInformation:
                "निकाली गई जानकारी को हमेशा अपने मूल पर्चे से मिलाकर जाँचें।",
            prescriptionStatus: "पर्चे की स्थिति",
            trackPrescriptionProgress:
                "अपने पर्चे की प्रक्रिया की स्थिति देखें",
            prescriptionUploaded: "पर्चा अपलोड किया गया",
            waitingForSubmission: "दस्तावेज़ जमा होने की प्रतीक्षा है",
            medicineDetailsExtraction: "दवाई की जानकारी निकालना",
            ocrProcessingNotConnected: "OCR प्रोसेसिंग कनेक्ट नहीं है",
            patientReview: "मरीज़ द्वारा जाँच",
            verifyBeforeConfirmation:
                "पुष्टि करने से पहले जानकारी जाँचें",
            noPrescriptionSubmitted: "अभी कोई पर्चा जमा नहीं किया गया",
            importantSafetyInformation: "महत्वपूर्ण सुरक्षा जानकारी",
            prescriptionSafetyDescription:
                "DAWAZ स्वयं दवाई की खुराक या कितनी बार लेनी है, यह तय नहीं करता। हमेशा डॉक्टर के पुष्ट पर्चे का पालन करें। यदि दवाई का नाम या कोई निर्देश स्पष्ट न हो, तो अपने डॉक्टर या फार्मासिस्ट से सलाह लें।"
        }
    };


    /* ============================================
       GENERIC TRANSLATION
    ============================================ */

    function translatePage() {

        const dictionary =
            translations[currentLanguage] || translations.en;

        document.querySelectorAll("[data-i18n]").forEach(element => {

            const key = element.dataset.i18n;

            if (dictionary[key] !== undefined) {
                element.textContent = dictionary[key];
            }

        });


        document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {

            const key = element.dataset.i18nPlaceholder;

            if (dictionary[key] !== undefined) {
                element.placeholder = dictionary[key];
            }

        });


        document.querySelectorAll("[data-i18n-aria-label]").forEach(element => {

            const key = element.dataset.i18nAriaLabel;

            if (dictionary[key] !== undefined) {
                element.setAttribute("aria-label", dictionary[key]);
            }

        });


        document.querySelectorAll("[data-i18n-title]").forEach(element => {

            const key = element.dataset.i18nTitle;

            if (dictionary[key] !== undefined) {
                element.title = dictionary[key];
            }

        });

    }


    /* ============================================
       DASHBOARD TRANSLATION
    ============================================ */

    function translateDashboard() {

        const dictionary =
            translations[currentLanguage] || translations.en;

        const setText = (selector, key) => {

            const element = document.querySelector(selector);

            if (element && dictionary[key] !== undefined) {
                element.textContent = dictionary[key];
            }

        };

        const setAllText = (selector, key) => {

            document.querySelectorAll(selector).forEach(element => {

                if (dictionary[key] !== undefined) {
                    element.textContent = dictionary[key];
                }

            });

        };


        if (document.querySelector(".dashboard-container")) {

            const navLinks = document.querySelectorAll(".nav-links a");

            const navKeys = [
                "dashboard",
                "medicines",
                "reminders",
                "scanner"
            ];

            navLinks.forEach((link, index) => {

                const key = navKeys[index];

                if (key && dictionary[key] !== undefined) {
                    link.textContent = dictionary[key];
                }

            });

        }


        setText(".profile span:last-child", "patient");

        setText(".greeting", "greeting");
        setText(".welcome-content h1", "welcome");
        setText(".welcome-description", "welcomeDescription");

        const dateLabel = document.querySelector(".date-display p");

        if (dateLabel) {
            dateLabel.textContent = dictionary.dailyOverview;
        }


        const eyebrowElements =
            document.querySelectorAll(".section-eyebrow");

        const eyebrowKeys = [
            "atGlance",
            "dailyTracker",
            "shortcuts"
        ];

        eyebrowElements.forEach((element, index) => {

            const key = eyebrowKeys[index];

            if (key && dictionary[key]) {
                element.textContent = dictionary[key];
            }

        });


        setText(".section-title h2", "overview");

        const overviewLabels =
            document.querySelectorAll(".overview-label");

        const overviewKeys = [
            "nextReminder",
            "todaysMedicines",
            "medicineStock"
        ];

        overviewLabels.forEach((element, index) => {

            const key = overviewKeys[index];

            if (key && dictionary[key]) {
                element.textContent = dictionary[key];
            }

        });


        setText("#nextReminderMedicine", "medicineReminder");

        const overviewDescriptions = document.querySelectorAll(
            ".overview-card p:not(.overview-label)"
        );

        const descriptionKeys = [
            null,
            "scheduledDoses",
            "unitsRemaining"
        ];

        overviewDescriptions.forEach((element, index) => {

            const key = descriptionKeys[index];

            if (key && dictionary[key]) {
                element.textContent = dictionary[key];
            }

        });


        setText(
            ".medicine-schedule-card .card-heading h2",
            "medicineSchedule"
        );

        setText(
            ".medicine-schedule-card .card-subtitle",
            "scheduleDescription"
        );

        setText(".view-all-link", "viewAll");
        setText(".progress-heading h3", "todaysProgress");
        setText(".progress-note", "progressNote");

        setAllText(".status.upcoming", "upcoming");


        document.querySelectorAll(".taken-checkbox span").forEach(element => {

            element.textContent = dictionary.markTaken;

        });


        setText(".quick-actions-card .card-heading h2", "quickActions");

        setText(
            ".quick-actions-card .card-subtitle",
            "quickActionsDescription"
        );


        const actionTitles = document.querySelectorAll(
            ".action-button strong"
        );

        const actionTitleKeys = [
            "scanMedicine",
            "askDawaz",
            "uploadPrescription"
        ];

        actionTitles.forEach((element, index) => {

            const key = actionTitleKeys[index];

            if (key && dictionary[key]) {
                element.textContent = dictionary[key];
            }

        });


        const actionDescriptions = document.querySelectorAll(
            ".action-button small"
        );

        const actionDescriptionKeys = [
            "scanDescription",
            "askDescription",
            "uploadDescription"
        ];

        actionDescriptions.forEach((element, index) => {

            const key = actionDescriptionKeys[index];

            if (key && dictionary[key]) {
                element.textContent = dictionary[key];
            }

        });


        setText(".dashboard-safety-note strong", "medicineSafety");
        setText(".dashboard-safety-note p", "safetyDescription");

    }


    /* ============================================
       LANGUAGE SELECTION
    ============================================ */

    function setLanguage(language) {

        if (!translations[language]) {
            language = DEFAULT_LANGUAGE;
        }

        currentLanguage = language;

        localStorage.setItem(LANGUAGE_KEY, currentLanguage);

        document.documentElement.lang = currentLanguage;

        translatePage();
        translateDashboard();


        const languageSelect =
            document.getElementById("languageSelect");

        if (languageSelect) {
            languageSelect.value = currentLanguage;
        }


        window.dispatchEvent(
            new CustomEvent("dawazLanguageChanged", {
                detail: {
                    language: currentLanguage
                }
            })
        );

    }


    /* ============================================
       INITIALIZATION
    ============================================ */

    function initializeLanguage() {

        const languageSelect =
            document.getElementById("languageSelect");

        if (languageSelect) {

            languageSelect.value = currentLanguage;

            languageSelect.addEventListener("change", function () {

                setLanguage(this.value);

            });

        }

        setLanguage(currentLanguage);

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeLanguage
        );

    } else {

        initializeLanguage();

    }


    /* ============================================
       PUBLIC FUNCTIONS FOR OTHER JS FILES
    ============================================ */

    window.DAWAZ_LANGUAGE = {

        getLanguage: function () {
            return currentLanguage;
        },

        setLanguage: setLanguage,

        translate: function (key) {

            const dictionary =
                translations[currentLanguage] || translations.en;

            return dictionary[key] || key;

        }

    };

})();



