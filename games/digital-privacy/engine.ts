
export interface SensitiveItem {
    text: string;
    type: string;
    reason: string;
}

export interface PromptScenario {
    title: string;
    text: string;
    sensitiveData: SensitiveItem[];
    inferences: string[];
    riskScore: number;
    saferVersion: string;
    whySafer: string;
}

export interface AnalysisResult {
    sensitiveData: SensitiveItem[];
    inferences: string[];
    riskScore: number;
    saferVersion: string;
    whySafer: string;
}

export interface GameState {
    currentPromptIndex: number;
    totalAnalyzed: number;
    totalRiskSum: number;
    totalSensitiveItems: number;
    isCustomMode: boolean;
}

export const INITIAL_STATE: GameState = {
    currentPromptIndex: 0,
    totalAnalyzed: 0,
    totalRiskSum: 0,
    totalSensitiveItems: 0,
    isCustomMode: false
};

export const EXAMPLE_PROMPTS: PromptScenario[] = [
    {
        title: "Medical Information Leak",
        text: "I'm Sarah Johnson from Portland. My 7-year-old son has type 1 diabetes. What are the best glucose monitors under $200?",
        sensitiveData: [
            { text: "Sarah Johnson", type: "Full Name", reason: "Real identity" },
            { text: "Portland", type: "Location", reason: "City of residence" },
            { text: "7-year-old son", type: "Family Info", reason: "Child's age and gender" },
            { text: "type 1 diabetes", type: "Health Condition", reason: "Serious medical diagnosis" },
            { text: "under $200", type: "Financial Info", reason: "Budget constraints" }
        ],
        inferences: [
            "Your full identity and location",
            "You have a young child with a chronic condition",
            "Your family's health history and medical needs",
            "Your approximate income level based on budget",
            "Your daily routines (diabetes management)",
            "Insurance coverage status (buying monitor yourself)"
        ],
        riskScore: 92,
        saferVersion: "What are effective glucose monitors for children with type 1 diabetes in the under-$200 price range?",
        whySafer: "Removes all identifying information (name, location, specific family details) while still getting the medical advice needed. The AI can't build a personal profile or connect this to other queries."
    },
    {
        title: "Location & Routine Exposure",
        text: "I take the #42 bus from Oak Street to downtown every weekday at 7:45 AM. Is there a faster route?",
        sensitiveData: [
            { text: "#42 bus", type: "Transit Route", reason: "Specific route number" },
            { text: "Oak Street", type: "Location", reason: "Home neighborhood" },
            { text: "downtown", type: "Location", reason: "Work area" },
            { text: "every weekday at 7:45 AM", type: "Routine", reason: "Predictable schedule" }
        ],
        inferences: [
            "Your home neighborhood (Oak Street area)",
            "Your work location (downtown)",
            "Your daily commute pattern and timing",
            "When your home is likely empty (weekdays 8AM-5PM)",
            "That you don't own a car (use public transit)",
            "Your approximate income level"
        ],
        riskScore: 78,
        saferVersion: "What are the fastest public transit routes from residential areas to downtown during morning rush hour?",
        whySafer: "Gets the same transportation advice without revealing your specific location, route, or schedule. No one can track your movements or know when you're not home."
    },
    {
        title: "Financial Privacy Breach",
        text: "I make $67,000 per year and have $45,000 in student loans. Can I afford to buy a $350,000 condo in Seattle?",
        sensitiveData: [
            { text: "$67,000 per year", type: "Income", reason: "Exact salary" },
            { text: "$45,000 in student loans", type: "Debt", reason: "Financial obligations" },
            { text: "$350,000 condo", type: "Financial Info", reason: "Purchase budget" },
            { text: "Seattle", type: "Location", reason: "City of residence" }
        ],
        inferences: [
            "Your exact income and debt levels",
            "Your location and where you're house hunting",
            "Your education level (student loans)",
            "Approximate age (career stage, income level)",
            "Credit worthiness and financial stability",
            "No significant savings (if asking about affordability)"
        ],
        riskScore: 85,
        saferVersion: "What salary and debt-to-income ratio is typically needed to afford a $350,000 home in a major West Coast city?",
        whySafer: "Removes your specific financial details and location while still getting the advice you need. Use the general guidance to assess your personal situation privately."
    },
    {
        title: "Work & Career Exposure",
        text: "I'm interviewing at Google's Seattle office next Tuesday for a Senior Software Engineer role. What should I prepare?",
        sensitiveData: [
            { text: "Google", type: "Employer", reason: "Specific company" },
            { text: "Seattle office", type: "Location", reason: "Office location" },
            { text: "next Tuesday", type: "Schedule", reason: "Specific date" },
            { text: "Senior Software Engineer", type: "Career Info", reason: "Position and level" }
        ],
        inferences: [
            "Your current job search status",
            "Your career level and skills",
            "Your location (Seattle area)",
            "Your schedule (free next Tuesday)",
            "Approximate salary expectations ($150k-250k range)",
            "Your employer may be notified if data is shared"
        ],
        riskScore: 74,
        saferVersion: "What should I prepare for a senior software engineering interview at a major tech company?",
        whySafer: "Gets you the same interview prep advice without revealing which company, when, or where. Protects your job search privacy and prevents conflicts with your current employer."
    },
    {
        title: "Family & Relationship Data",
        text: "My wife Emma and I are trying to get pregnant. She's 34 and has PCOS. What fertility treatments should we consider?",
        sensitiveData: [
            { text: "My wife Emma", type: "Family & Name", reason: "Spouse's name" },
            { text: "trying to get pregnant", type: "Private Plans", reason: "Reproductive plans" },
            { text: "34", type: "Age", reason: "Spouse's age" },
            { text: "PCOS", type: "Health Condition", reason: "Medical diagnosis" }
        ],
        inferences: [
            "Your marital status and spouse's name",
            "Your reproductive plans and timeline",
            "Your spouse's age and health condition",
            "Potential fertility struggles and emotional stress",
            "Your approximate age range (likely 30s)",
            "Future family plans and financial commitments"
        ],
        riskScore: 88,
        saferVersion: "What fertility treatment options are available for a 34-year-old woman with PCOS who is trying to conceive?",
        whySafer: "Removes identifying information and personal relationship details while getting the same medical information. The advice remains relevant without exposing private family matters."
    },
    {
        title: "Children's Privacy Violation",
        text: "My daughter Sophia (age 9) attends Lincoln Elementary. She's being bullied by classmates. How should I talk to the school?",
        sensitiveData: [
            { text: "daughter Sophia", type: "Child's Name", reason: "Minor's identity" },
            { text: "age 9", type: "Child's Age", reason: "Specific age" },
            { text: "Lincoln Elementary", type: "School Name", reason: "Specific institution" },
            { text: "being bullied", type: "Sensitive Info", reason: "Child's personal issues" }
        ],
        inferences: [
            "Your child's name, age, and school",
            "Your location (Lincoln Elementary's area)",
            "Your child's social difficulties",
            "Your family structure (have a daughter)",
            "Your parenting concerns and style",
            "School's potential liability issues"
        ],
        riskScore: 95,
        saferVersion: "What's the best way to address bullying concerns with a child's elementary school administration?",
        whySafer: "Protects your child's identity, school, and personal issues. Gets the same advice on handling bullying without creating a permanent digital record about your child."
    },
    {
        title: "Legal & Sensitive Matters",
        text: "I was arrested for DUI last month in King County. I have a court date on June 15th. What should I expect?",
        sensitiveData: [
            { text: "arrested for DUI", type: "Legal Issue", reason: "Criminal matter" },
            { text: "last month", type: "Timeline", reason: "Recent event" },
            { text: "King County", type: "Location", reason: "Specific jurisdiction" },
            { text: "June 15th", type: "Court Date", reason: "Legal schedule" }
        ],
        inferences: [
            "Your criminal record and legal troubles",
            "Your location (King County area)",
            "Your schedule and court obligations",
            "Potential employment consequences",
            "Insurance rate impacts",
            "Pattern if combined with other queries"
        ],
        riskScore: 91,
        saferVersion: "What typically happens during a first court appearance for a DUI charge? What should someone expect in the process?",
        whySafer: "Gets general legal information without creating a record of your specific case, location, or timeline. Note: AI conversations are not privileged - consult a real lawyer."
    },
    {
        title: "Political & Religious Views",
        text: "I'm a conservative Christian homeschooling my 3 kids in Texas. What curriculum works best for teaching evolution from a creationist perspective?",
        sensitiveData: [
            { text: "conservative Christian", type: "Religion/Politics", reason: "Beliefs" },
            { text: "homeschooling my 3 kids", type: "Family & Education", reason: "Children and choices" },
            { text: "Texas", type: "Location", reason: "State residence" },
            { text: "creationist perspective", type: "Religious Views", reason: "Specific beliefs" }
        ],
        inferences: [
            "Your religious and political beliefs",
            "Your parenting choices and education philosophy",
            "Number and ages of your children",
            "Your location and community",
            "Your stance on science education",
            "Potential social and political network"
        ],
        riskScore: 72,
        saferVersion: "What homeschool science curricula are available that teach both evolutionary biology and alternative perspectives?",
        whySafer: "Removes your personal beliefs, location, and family details while getting the curriculum options."
    },
    {
        title: "Relationship & Mental Health",
        text: "I think my husband is cheating on me. He's been secretive with his phone and working late 4 nights a week. Should I confront him or hire a private investigator?",
        sensitiveData: [
            { text: "husband is cheating", type: "Relationship Issue", reason: "Private matter" },
            { text: "secretive with his phone", type: "Behavior Pattern", reason: "Specific evidence" },
            { text: "working late 4 nights a week", type: "Schedule", reason: "Routine details" },
            { text: "hire a private investigator", type: "Intent", reason: "Planned action" }
        ],
        inferences: [
            "Marital problems and trust issues",
            "Your emotional state and stress level",
            "Your spouse's schedule and habits",
            "Your financial ability (PI budget)",
            "Potential divorce proceedings coming",
            "Your social support network status"
        ],
        riskScore: 87,
        saferVersion: "What are effective ways to address trust issues and communication problems in a marriage?",
        whySafer: "Addresses the core relationship concern without sharing private details about your spouse's behavior or your investigation plans."
    },
    {
        title: "Immigration Status",
        text: "I'm on an H1B visa working at Microsoft. My visa expires in 3 months and my green card application is delayed. Can I switch employers without losing status?",
        sensitiveData: [
            { text: "H1B visa", type: "Immigration Status", reason: "Visa type" },
            { text: "Microsoft", type: "Employer", reason: "Current company" },
            { text: "expires in 3 months", type: "Timeline", reason: "Visa deadline" },
            { text: "green card application", type: "Immigration", reason: "Status plans" }
        ],
        inferences: [
            "Your immigration status and vulnerability",
            "Your current employer",
            "Your job security concerns",
            "Your career and location constraints",
            "Your country of origin (likely)",
            "Your long-term residency plans"
        ],
        riskScore: 82,
        saferVersion: "What are the rules for changing employers while on an H1B visa near expiration with a pending green card application?",
        whySafer: "Gets the same immigration law information without revealing your employer, specific timeline, or creating a record that could affect your application."
    },
    {
        title: "Substance Use & Health",
        text: "I'm 28 weeks pregnant and occasionally smoke marijuana to help with nausea. Is this safe for my baby?",
        sensitiveData: [
            { text: "28 weeks pregnant", type: "Health Status", reason: "Pregnancy details" },
            { text: "smoke marijuana", type: "Substance Use", reason: "Drug use admission" },
            { text: "help with nausea", type: "Medical Reason", reason: "Health symptoms" }
        ],
        inferences: [
            "Your pregnancy status and timeline",
            "Your substance use during pregnancy",
            "Your health concerns and symptoms",
            "Potential legal implications (state-dependent)",
            "Your due date (approximately 12 weeks)",
            "Medical compliance and risk awareness"
        ],
        riskScore: 93,
        saferVersion: "What does medical research say about marijuana use during pregnancy and potential effects on fetal development?",
        whySafer: "Gets factual medical information without admitting to substance use or revealing pregnancy status. Note: This kind of health question should be discussed with a real doctor, not AI."
    },
    {
        title: "Smart Home & Security",
        text: "I installed Ring cameras at 742 Evergreen Terrace. They keep detecting motion at my back door between 2-3 AM when I'm asleep. Should I be worried?",
        sensitiveData: [
            { text: "742 Evergreen Terrace", type: "Address", reason: "Exact home address" },
            { text: "Ring cameras", type: "Security System", reason: "Specific devices" },
            { text: "back door", type: "Property Layout", reason: "Home layout" },
            { text: "2-3 AM when I'm asleep", type: "Routine", reason: "Vulnerable hours" }
        ],
        inferences: [
            "Your exact home address",
            "Your security system details",
            "When you're asleep and vulnerable",
            "Your home's layout and entry points",
            "That you live alone or with others",
            "Potential security vulnerabilities"
        ],
        riskScore: 96,
        saferVersion: "My security cameras keep detecting motion at night. What could cause false alerts, and when should I be concerned?",
        whySafer: "Addresses the security concern without revealing your address, specific system, or exact vulnerable times. Never share addresses or security details online."
    }
];

export function analyzeCustomText(text: string): AnalysisResult {
    const sensitiveData: SensitiveItem[] = [];
    const inferences: string[] = [];
    let riskScore = 10; // Base risk

    // Check for names (simple heuristic)
    const namePatterns = /\b(I'm|I am|my name is|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi;
    const nameMatches = text.match(namePatterns);
    if (nameMatches) {
        nameMatches.forEach(match => {
            sensitiveData.push({ text: match, type: 'Name', reason: 'Personal identity' });
        });
        inferences.push('Your personal identity');
        riskScore += 20;
    }

    // Check for locations
    const locationWords = ['street', 'avenue', 'road', 'city', 'town', 'county', 'state'];
    locationWords.forEach(word => {
        const regex = new RegExp(`\\b\\w+\\s+${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
            matches.forEach(match => {
                sensitiveData.push({ text: match, type: 'Location', reason: 'Geographic data' });
            });
        }
    });
    if (text.match(/\b\d+\s+\w+\s+(street|avenue|road|lane|drive)\b/gi)) {
        inferences.push('Your physical address or location');
        riskScore += 25;
    }

    // Check for ages
    if (text.match(/\b\d+[\s-]?year[\s-]?old\b/gi) || text.match(/\bage\s+\d+\b/gi)) {
        sensitiveData.push({ text: 'age information', type: 'Age', reason: 'Demographic data' });
        inferences.push('Age of you or family members');
        riskScore += 15;
    }

    // Check for medical terms
    const medicalTerms = ['disease', 'diagnosis', 'diabetes', 'cancer', 'illness', 'condition', 'treatment', 'medication', 'doctor', 'hospital', 'pregnant', 'surgery'];
    medicalTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (text.match(regex)) {
            sensitiveData.push({ text: term, type: 'Health Info', reason: 'Medical condition' });
        }
    });
    if (sensitiveData.some(item => item.type === 'Health Info')) {
        inferences.push('Your or family members\' health conditions');
        riskScore += 20;
    }

    // Check for financial info
    if (text.match(/\$[\d,]+/g)) {
        const amounts = text.match(/\$[\d,]+/g);
        amounts?.forEach(amount => {
            sensitiveData.push({ text: amount, type: 'Financial', reason: 'Money amounts' });
        });
        inferences.push('Your financial situation and budget');
        riskScore += 18;
    }

    // Check for family references
    const familyTerms = ['son', 'daughter', 'wife', 'husband', 'child', 'kids', 'mother', 'father', 'parent'];
    familyTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (text.match(regex)) {
            sensitiveData.push({ text: term, type: 'Family', reason: 'Family structure' });
        }
    });
    if (sensitiveData.some(item => item.type === 'Family')) {
        inferences.push('Your family structure and relationships');
        riskScore += 12;
    }

    // Check for work/career
    const workTerms = ['job', 'work', 'employer', 'company', 'interview', 'salary', 'career'];
    if (workTerms.some(term => text.toLowerCase().includes(term))) {
        inferences.push('Your employment status and career level');
        riskScore += 10;
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Generate safer version (simplified)
    let saferVersion = text;
    if (sensitiveData.length > 0) {
        saferVersion = "A safer version would remove specific personal details like names, locations, exact ages, and financial amounts while keeping the core question.";
    }

    const whySafer = sensitiveData.length > 0
        ? `This prompt contained ${sensitiveData.length} sensitive data point(s). Removing identifying information protects your privacy while still allowing you to get helpful responses.`
        : "This prompt appears relatively safe with minimal personal information shared.";

    if (inferences.length === 0) {
        inferences.push('Minimal personal information detected');
    }

    return {
        sensitiveData,
        inferences,
        riskScore,
        saferVersion,
        whySafer
    };
}
