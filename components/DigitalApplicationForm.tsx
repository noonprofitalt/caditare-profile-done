import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Candidate, WorkflowStage, StageStatus, MedicalStatus, Country, JobRole, ProfileCompletionStatus, RegistrationSource, PassportData, PassportStatus, PCCStatus } from '../types';
import { CandidateService } from '../services/candidateService';
import { ComplianceService } from '../services/complianceService';
import { WORKFLOW_STAGES } from '../services/workflowEngine.v2';
import { ProfileCompletionService } from '../services/profileCompletionService';
import { NICService } from '../services/nicService';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Save, X, AlertCircle, CheckCircle, Calendar, FileEdit, TrendingUp, ShieldCheck, ShieldAlert, UserPlus, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import MultiSelect from './ui/MultiSelect';
import PreferredCountriesSelector from './ui/PreferredCountriesSelector';
import MultiPhoneInput from './ui/MultiPhoneInput';
import MultiEducationSelector from './ui/MultiEducationSelector';
import MedicalStatusInput from './ui/MedicalStatusInput';
import { TemplateService } from '../services/templateService';
import { ProfileMergeService } from '../services/profileMergeService';
import { NotificationService } from '../services/notificationService';
import JobRoleEntry from './JobRoleEntry';
import { DataSyncService } from '../services/dataSyncService';

const ValidationIndicator: React.FC<{ value: any; label: string }> = ({ value, label }) => {
    const isValid = value && (Array.isArray(value) ? value.length > 0 : String(value).trim().length > 0);
    return (
        <div className="flex items-center gap-1 mt-1">
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${isValid ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <span className={`text-[8px] font-black uppercase tracking-tighter ${isValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isValid ? 'Completed' : `Required: ${label}`}
            </span>
        </div>
    );
};

const DigitalApplicationForm: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const upgradeId = searchParams.get('upgrade');
    const [isUpgradeMode, setIsUpgradeMode] = useState(false);
    const [existingCandidate, setExistingCandidate] = useState<Candidate | null>(null);
    const [formData, setFormData] = useState<Partial<Candidate>>(() => ({
        // Header
        refNo: `APP-${Date.now()}`,
        applicationDate: new Date().toISOString().split('T')[0],
        country: '',
        position: '',

        // Personal Details
        surname: '',
        otherNames: '',
        dob: '',
        age: '',
        gender: '',
        nationality: 'Sri Lankan', // Default
        placeOfBirth: '',
        passportProfession: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',

        // Administrative
        province: '',
        divisionalSecretariat: '',
        gsDivision: '',
        district: '',
        drivingLicenseNo: '',

        // Physical & Personal
        height: { feet: 0, inches: 0 },
        weight: 0,
        religion: '',
        maritalStatus: 'Single',
        numberOfChildren: 0,

        // Education
        school: '',
        gceOL: { year: '' },
        gceAL: { year: '' },
        educationalQualifications: [],

        // Family
        fatherName: '',
        motherName: '',
        spouseName: '',
        guardianName: '',
        guardianIdNo: '',
        guardianBirthday: '',
        guardianContact: '',
        children: [],

        // Professional
        employmentHistory: [],
        trainingDetails: '',
        specialAchievements: '',

        // System defaults
        stage: WorkflowStage.REGISTERED,
        stageStatus: StageStatus.PENDING,
        stageEnteredAt: new Date().toISOString(),
        avatarUrl: 'https://ui-avatars.com/api/?name=New+Applicant',
        location: '',
        preferredCountries: [],
        skills: [],
        role: '',
        experienceYears: 0,
        stageData: {},
        workflowLogs: [],
        timelineEvents: [],
        comments: [],
        documents: [],
        officeUseOnly: { customerCareOfficer: '', fileHandlingOfficer: '', date: '', charges: '' }
    }));

    const [educationRows, setEducationRows] = useState([
        { courseName: '', level: '', institute: '', year: '' }
    ]);

    const [employmentRows, setEmploymentRows] = useState({
        local: [{ position: '', companyName: '', years: 0 }],
        foreign: [{ position: '', companyName: '', country: '', years: 0 }]
    });

    const [childrenRows, setChildrenRows] = useState<{ name: string; gender: 'M' | 'F'; age: number }[]>([
        { name: '', gender: 'M', age: 0 }
    ]);

    // NEW: Job Roles State
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);

    // NEW: Education Multi-Select State
    const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
    const educationOptions = ['Primary', 'O/L', 'A/L', 'Diploma', 'Degree', 'Masters', 'PhD', 'Vocational', 'Professional Certificate'];

    // NEW: Preferred Countries Multi-Select State
    const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
    const countryOptions = Object.values(Country);

    // NEW: Medical Status State
    const [medicalStatus, setMedicalStatus] = useState<MedicalStatus>(MedicalStatus.NOT_STARTED);
    const [medicalScheduledDate, setMedicalScheduledDate] = useState('');
    const [medicalCompletedDate, setMedicalCompletedDate] = useState('');
    const [medicalBloodGroup, setMedicalBloodGroup] = useState('');
    const [medicalAllergies, setMedicalAllergies] = useState('');
    const [medicalNotes, setMedicalNotes] = useState('');

    // NEW: Passport Compliance State (Multi-Passport)
    const [passports, setPassports] = useState<PassportData[]>([{
        passportNumber: '',
        country: 'Sri Lanka',
        issuedDate: '',
        expiryDate: '',
        status: PassportStatus.VALID,
        validityDays: 0
    }]);

    // NEW: PCC Tracking State
    const [pccIssuedDate, setPccIssuedDate] = useState('');
    const [pccLastInspectionDate, setPccLastInspectionDate] = useState('');

    // NEW: Additional Contact Numbers State
    const [additionalContacts, setAdditionalContacts] = useState<string[]>([]);

    // WIZARD & DRAFT STATE
    const [currentStep, setCurrentStep] = useState(1);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // AUTO-SAVE DRAFT (Every 10 seconds)
    useEffect(() => {
        // Only draft for NEW candidates to prevent overwriting existing ones during upgrades
        if (isUpgradeMode) return;

        const timer = setTimeout(() => {
            const draft = {
                formData, educationRows, employmentRows, childrenRows,
                jobRoles, selectedEducation, preferredCountries,
                medicalStatus, medicalScheduledDate, medicalCompletedDate,
                medicalBloodGroup, medicalAllergies, medicalNotes,
                passports, pccIssuedDate, pccLastInspectionDate,
                additionalContacts, currentStep,
                timestamp: Date.now()
            };
            localStorage.setItem(`candidate_draft_${user?.id || 'guest'}`, JSON.stringify(draft));
            setLastSaved(new Date().toLocaleTimeString());
        }, 10000);

        return () => clearTimeout(timer);
    }, [formData, educationRows, employmentRows, childrenRows, jobRoles, selectedEducation, preferredCountries, medicalStatus, passports, pccIssuedDate, additionalContacts, currentStep]);

    // RESTORE DRAFT ON MOUNT
    useEffect(() => {
        const checkDraft = () => {
            if (isUpgradeMode) return;
            const saved = localStorage.getItem(`candidate_draft_${user?.id || 'guest'}`);
            if (saved) {
                const draft = JSON.parse(saved);
                // Only suggest if draft is less than 24 hours old
                if (Date.now() - draft.timestamp < 86400000) {
                    const confirmRestore = window.confirm("You have an unsaved draft from " + new Date(draft.timestamp).toLocaleString() + ". Would you like to restore it?");
                    if (confirmRestore) {
                        setFormData(draft.formData);
                        setEducationRows(draft.educationRows);
                        setEmploymentRows(draft.employmentRows);
                        setChildrenRows(draft.childrenRows);
                        setJobRoles(draft.jobRoles);
                        setSelectedEducation(draft.selectedEducation);
                        setPreferredCountries(draft.preferredCountries);
                        setMedicalStatus(draft.medicalStatus);
                        setMedicalScheduledDate(draft.medicalScheduledDate);
                        setMedicalCompletedDate(draft.medicalCompletedDate);
                        setMedicalBloodGroup(draft.medicalBloodGroup);
                        setMedicalAllergies(draft.medicalAllergies);
                        setMedicalNotes(draft.medicalNotes);
                        setPassports(draft.passports);
                        setPccIssuedDate(draft.pccIssuedDate);
                        setPccLastInspectionDate(draft.pccLastInspectionDate);
                        setAdditionalContacts(draft.additionalContacts);
                        setCurrentStep(draft.currentStep);
                        NotificationService.addNotification({
                            type: 'SUCCESS',
                            title: 'Draft Restored',
                            message: 'Your progress has been recovered.'
                        });
                    } else {
                        localStorage.removeItem(`candidate_draft_${user?.id || 'guest'}`);
                    }
                }
            }
        };
        // Small delay to ensure isUpgradeMode is set
        setTimeout(checkDraft, 500);
    }, [isUpgradeMode]);

    // Load existing candidate data if in upgrade mode
    useEffect(() => {
        const fetchCandidate = async () => {
            if (upgradeId) {
                const candidate = await CandidateService.getCandidateById(upgradeId);
                if (candidate) {
                    setIsUpgradeMode(true);
                    setExistingCandidate(candidate);

                    // Standardize data using DataSyncService for perfect population
                    const syncedData = DataSyncService.fullSync(candidate);

                    setFormData(prev => ({
                        ...prev,
                        ...syncedData,
                        // Ensure position/role sync if one is missing
                        position: syncedData.position || syncedData.role || '',
                        targetCountry: syncedData.targetCountry || syncedData.country || '',
                    }));

                    // Pre-fill additional states
                    if (candidate.education) setSelectedEducation(candidate.education);
                    if (candidate.preferredCountries) setPreferredCountries(candidate.preferredCountries);
                    if (candidate.jobRoles) {
                        const mappedRoles: JobRole[] = candidate.jobRoles.map(r =>
                            typeof r === 'string'
                                ? { title: r, experienceYears: 0, skillLevel: 'Beginner' }
                                : r
                        );
                        setJobRoles(mappedRoles);
                    }
                    if (candidate.additionalContactNumbers && candidate.additionalContactNumbers.length > 0) {
                        setAdditionalContacts(candidate.additionalContactNumbers);
                    } else if (candidate.secondaryPhone) {
                        setAdditionalContacts([candidate.secondaryPhone]);
                    }

                    // Pre-fill medical status
                    if (candidate.stageData?.medicalStatus) {
                        setMedicalStatus(candidate.stageData.medicalStatus);
                        if (candidate.stageData.medicalScheduledDate) setMedicalScheduledDate(candidate.stageData.medicalScheduledDate);
                        if (candidate.stageData.medicalCompletedDate) setMedicalCompletedDate(candidate.stageData.medicalCompletedDate);
                        if (candidate.stageData.medicalNotes) setMedicalNotes(candidate.stageData.medicalNotes);
                        if (candidate.medicalData?.bloodGroup) setMedicalBloodGroup(candidate.medicalData.bloodGroup);
                        if (candidate.medicalData?.allergies) setMedicalAllergies(candidate.medicalData.allergies);
                    }

                    // Pre-fill passport data
                    if (candidate.passports && candidate.passports.length > 0) {
                        setPassports(candidate.passports);
                    } else if (candidate.passportData) {
                        // Legacy migration
                        setPassports([candidate.passportData]);
                    }

                    // Pre-fill PCC data
                    if (candidate.pccData) {
                        setPccIssuedDate(candidate.pccData.issuedDate || '');
                        setPccLastInspectionDate(candidate.pccData.lastInspectionDate || '');
                    }

                    // Pre-fill dynamic rows
                    if (candidate.educationalQualifications && candidate.educationalQualifications.length > 0) {
                        setEducationRows(candidate.educationalQualifications);
                    }
                    if (candidate.employmentHistory && candidate.employmentHistory.length > 0) {
                        const local = candidate.employmentHistory.filter(e => e.type === 'Local');
                        const foreign = candidate.employmentHistory
                            .filter(e => e.type === 'Foreign')
                            .map(e => ({ ...e, country: e.country || '' }));
                        setEmploymentRows({ local, foreign });
                    }
                    if (candidate.children && candidate.children.length > 0) {
                        setChildrenRows(candidate.children);
                    }
                }
            }
        }
        fetchCandidate();
    }, [upgradeId]);

    // --- Workflow Guarding Helpers ---
    const currentStageIndex = WORKFLOW_STAGES.indexOf(formData.stage || WorkflowStage.REGISTERED);
    const isStageAtLeast = (stage: WorkflowStage) => {
        return currentStageIndex >= WORKFLOW_STAGES.indexOf(stage);
    };

    // FRICTIONLESS: Workflow guards disabled to allow editing at any stage
    const canEditPersonal = true; // !isUpgradeMode || !isStageAtLeast(WorkflowStage.APPLIED);
    const canEditCompliance = true; // !isUpgradeMode || !isStageAtLeast(WorkflowStage.VISA_RECEIVED);


    const handleInputChange = (field: string, value: any) => {
        const personalFields = ['surname', 'otherNames', 'nic', 'drivingLicenseNo', 'dob', 'nationality', 'placeOfBirth', 'passportProfession'];
        if (personalFields.includes(field) && !canEditPersonal) return; // Guard

        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // INTEGRITY: Smart NIC Parsing (Mirroring QuickAdd for absolute consistency)
            if (field === 'nic') {
                const parsed = NICService.parseNIC(value);
                if (parsed) {
                    updated.dob = parsed.dob;
                    updated.gender = parsed.gender;
                }
            }

            // SYNC: Auto-generate Name from components
            if (field === 'surname' || field === 'otherNames') {
                const s = field === 'surname' ? value : prev.surname;
                const o = field === 'otherNames' ? value : prev.otherNames;
                updated.name = `${o} ${s}`.trim();
            }

            // SYNC: Bidirectional Role/Position mapping
            if (field === 'position') updated.role = value;
            if (field === 'role') updated.position = value;

            return updated;
        });
    };


    const handleNestedChange = (field: string, nestedField: string, value: any) => {
        setFormData(prev => ({
            ...prev,

            [field]: { ...((prev as any)[field]), [nestedField]: value }
        }));
    };

    const addEducationRow = () => {
        setEducationRows([...educationRows, { courseName: '', level: '', institute: '', year: '' }]);
    };

    const removeEducationRow = (index: number) => {
        setEducationRows(educationRows.filter((_, i) => i !== index));
    };

    const addEmploymentRow = (type: 'local' | 'foreign') => {
        if (type === 'local') {
            setEmploymentRows({
                ...employmentRows,
                local: [...employmentRows.local, { position: '', companyName: '', years: 0 }]
            });
        } else {
            setEmploymentRows({
                ...employmentRows,
                foreign: [...employmentRows.foreign, { position: '', companyName: '', country: '', years: 0 }]
            });
        }
    };

    const removeEmploymentRow = (type: 'local' | 'foreign', index: number) => {
        if (type === 'local') {
            setEmploymentRows({
                ...employmentRows,
                local: employmentRows.local.filter((_, i) => i !== index)
            });
        } else {
            setEmploymentRows({
                ...employmentRows,
                foreign: employmentRows.foreign.filter((_, i) => i !== index)
            });
        }
    };

    const addChildRow = () => {
        setChildrenRows([...childrenRows, { name: '', gender: 'M', age: 0 }]);
    };

    const removeChildRow = (index: number) => {
        setChildrenRows(childrenRows.filter((_, i) => i !== index));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Compile employment history
        const employmentHistory = [
            ...employmentRows.local.map(row => ({ ...row, type: 'Local' as const })),
            ...employmentRows.foreign.map(row => ({ ...row, type: 'Foreign' as const }))
        ];

        // Create candidate data
        // Priority: Recalculated from components > typed in name field
        const constructedName = `${formData.otherNames} ${formData.surname}`.trim();
        const constructedLocation = formData.city ? `${formData.city}, ${formData.address}` : formData.address || '';

        // Construct PCC Data
        const pccData = pccIssuedDate ? {
            issuedDate: pccIssuedDate,
            lastInspectionDate: pccLastInspectionDate,
            status: PCCStatus.VALID, // Placeholder, will rely on backend/service to recalculate status
            ageDays: 0 // Placeholder
        } : undefined;

        const candidateData = DataSyncService.fullSync({
            ...formData,
            name: constructedName,
            educationalQualifications: educationRows,
            employmentHistory,
            children: childrenRows,
            role: formData.position || 'General Worker',
            position: formData.position || 'General Worker',
            location: formData.district || '',
            city: formData.district || '',
            district: formData.district || '',
            country: formData.country || formData.targetCountry || '',
            targetCountry: formData.country || formData.targetCountry || '',
            preferredCountries: preferredCountries,
            education: selectedEducation,
            jobRoles: jobRoles,
            additionalContactNumbers: additionalContacts,
            secondaryPhone: additionalContacts.length > 0 ? additionalContacts[0] : '',
            passports,
            passportData: passports.length > 0 ? passports[0] : undefined,
            pccData,
            stageData: {
                ...formData.stageData,
                medicalStatus,
                medicalScheduledDate: medicalStatus === MedicalStatus.SCHEDULED ? medicalScheduledDate : undefined,
                medicalCompletedDate: medicalStatus === MedicalStatus.COMPLETED ? medicalCompletedDate : undefined,
                medicalNotes: medicalNotes || undefined
            },
            medicalData: {
                status: medicalStatus,
                bloodGroup: medicalBloodGroup,
                allergies: medicalAllergies,
                notes: medicalNotes,
                scheduledDate: medicalScheduledDate,
                completedDate: medicalCompletedDate
            },
        });

        if (isUpgradeMode && existingCandidate) {
            // UPGRADE MODE: Safely merge using the service
            const updatedCandidate = ProfileMergeService.mergeProfiles(existingCandidate, candidateData);

            await CandidateService.updateCandidate(updatedCandidate);
            NotificationService.addNotification({
                type: 'SUCCESS',
                title: 'Profile Upgraded',
                message: `${constructedName} has been upgraded to a full profile.`,
                candidateId: existingCandidate.id
            });

            navigate(`/candidates/${existingCandidate.id}`);
        } else {
            // NEW CANDIDATE MODE
            const newCandidate: Candidate = {
                ...candidateData as Candidate,
                id: candidateData.id || crypto.randomUUID(), // Ensure ID is present and valid UUID
                stage: WorkflowStage.REGISTERED,
                stageStatus: StageStatus.PENDING,
                stageEnteredAt: new Date().toISOString(),
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(candidateData.name || 'New Applicant')}`,
                workflowLogs: [],
                comments: [],
                timelineEvents: [{
                    id: `evt-${Date.now()}`,
                    type: 'SYSTEM',
                    title: 'Full Application Submitted',
                    description: 'Candidate registered via Digital Application Form.',
                    timestamp: new Date().toISOString(),
                    actor: user?.name || 'Internal Staff',
                    userId: user?.id,
                    stage: WorkflowStage.REGISTERED
                }],
                documents: [],
                registrationSource: RegistrationSource.FULL_FORM
            };

            // Calculate profile completion
            const completionData = ProfileCompletionService.updateCompletionData(newCandidate);
            const finalCandidate = { ...newCandidate, ...completionData };

            await CandidateService.addCandidate(finalCandidate);
            navigate('/candidates');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-8 relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">Suhara Foreign Employment Agency</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="bg-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-white/10">Digital Intake Phase II</span>
                                <p className="text-blue-100 text-sm">Case Master: {user?.name || 'Administrative staff'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {lastSaved && (
                                <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                                    <Save size={12} className="text-emerald-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Draft Saved {lastSaved}</span>
                                </div>
                            )}
                            <button
                                onClick={() => navigate('/candidates')}
                                className="p-3 hover:bg-white/10 rounded-xl transition-all hover:rotate-90"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* STEP INDICATOR */}
                    <div className="grid grid-cols-3 gap-4 relative z-10">
                        {[
                            { step: 1, label: 'Identity & Contact', icon: <UserPlus size={18} /> },
                            { step: 2, label: 'Professional & Family', icon: <Briefcase size={18} /> },
                            { step: 3, label: 'Compliance & Finalize', icon: <ShieldCheck size={18} /> }
                        ].map((s) => (
                            <div
                                key={s.step}
                                onClick={() => setCurrentStep(s.step)}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer border-2 ${currentStep === s.step
                                    ? 'bg-white text-blue-900 border-blue-400 shadow-xl scale-[1.02]'
                                    : currentStep > s.step
                                        ? 'bg-blue-600/50 text-white border-blue-400/30'
                                        : 'bg-white/5 border-white/10 text-blue-200 opacity-60'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentStep === s.step ? 'bg-blue-900 text-white' : 'bg-white/10'
                                    }`}>
                                    {currentStep > s.step ? <CheckCircle size={20} className="text-emerald-300 fill-emerald-300/20" /> : s.icon}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-[10px] font-black uppercase tracking-tight opacity-60">Step 0{s.step}</p>
                                    <p className="text-xs font-black uppercase tracking-wider">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-12 bg-slate-50/30">
                    {/* UNIVERSAL HEADER FIELDS (Visible across all steps) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Application Date</label>
                            <input
                                type="date"
                                value={formData.applicationDate}
                                onChange={(e) => handleInputChange('applicationDate', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Target Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                                placeholder="e.g. Romania, UAE"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Desired Position</label>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => handleInputChange('position', e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                                placeholder="e.g. General Worker"
                            />
                        </div>
                    </div>
                    {/* STEP 1: IDENTITY & CONTACT */}
                    {currentStep === 1 && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <section className="space-y-6">
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                                    Personal Information
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Surname *</label>
                                        <input
                                            type="text"
                                            // FRICTIONLESS: Required removed
                                            value={formData.surname || ''}
                                            onChange={(e) => handleInputChange('surname', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Other Names *</label>
                                        <input
                                            type="text"
                                            value={formData.otherNames || ''}
                                            onChange={(e) => handleInputChange('otherNames', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* PASSPORT COMPLIANCE SECTION - MULTI PASSPORT */}
                                <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <ShieldCheck size={18} />
                                                Passport Compliance
                                            </h3>
                                            {!canEditCompliance && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase border border-slate-200">
                                                    <ShieldAlert size={12} /> Read-only (Stage: {formData.stage})
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {passports.map((passport, idx) => (
                                                <div key={idx} className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm relative group">
                                                    {idx > 0 && canEditCompliance && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPassports(passports.filter((_, i) => i !== idx))}
                                                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1"
                                                            title="Remove Passport"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Passport Number</label>
                                                            <input
                                                                type="text"
                                                                value={passport.passportNumber}
                                                                onChange={(e) => {
                                                                    const updated = [...passports];
                                                                    updated[idx].passportNumber = e.target.value;
                                                                    setPassports(updated);
                                                                }}
                                                                readOnly={!canEditCompliance}
                                                                placeholder="e.g., N1234567"
                                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditCompliance ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Passport Country</label>
                                                            <input
                                                                type="text"
                                                                value={passport.country}
                                                                onChange={(e) => {
                                                                    const updated = [...passports];
                                                                    updated[idx].country = e.target.value;
                                                                    setPassports(updated);
                                                                }}
                                                                readOnly={!canEditCompliance}
                                                                placeholder="e.g., Sri Lanka"
                                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditCompliance ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Issued Date</label>
                                                            <input
                                                                type="date"
                                                                value={passport.issuedDate ? new Date(passport.issuedDate).toISOString().split('T')[0] : ''}
                                                                onChange={(e) => {
                                                                    const updated = [...passports];
                                                                    updated[idx].issuedDate = e.target.value;
                                                                    setPassports(updated);
                                                                }}
                                                                readOnly={!canEditCompliance}
                                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditCompliance ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Expiry Date</label>
                                                            <input
                                                                type="date"
                                                                value={passport.expiryDate ? new Date(passport.expiryDate).toISOString().split('T')[0] : ''}
                                                                onChange={(e) => {
                                                                    const updated = [...passports];
                                                                    updated[idx].expiryDate = e.target.value;
                                                                    // Auto-evaluate status
                                                                    const evaluation = ComplianceService.evaluatePassport(
                                                                        e.target.value,
                                                                        passport.passportNumber,
                                                                        passport.country,
                                                                        passport.issuedDate
                                                                    );
                                                                    updated[idx].status = evaluation.status;
                                                                    updated[idx].validityDays = evaluation.validityDays;
                                                                    setPassports(updated);
                                                                }}
                                                                readOnly={!canEditCompliance}
                                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditCompliance ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                                            />
                                                            {passport.expiryDate && (
                                                                <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase w-fit ${passport.status === PassportStatus.VALID ? 'bg-green-50 text-green-700 border border-green-200' :
                                                                    passport.status === PassportStatus.EXPIRING ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                                        'bg-red-50 text-red-700 border border-red-200'
                                                                    }`}>
                                                                    {passport.status === PassportStatus.VALID ? <ShieldCheck size={12} /> :
                                                                        passport.status === PassportStatus.EXPIRING ? <ShieldCheck size={12} className="text-yellow-500" /> :
                                                                            <ShieldAlert size={12} />}
                                                                    {passport.status} • {passport.validityDays} Days Left
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Validity Status */}
                                                    {passport.passportNumber && passport.expiryDate && passport.issuedDate && (
                                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                                            {(() => {
                                                                const status = ComplianceService.evaluatePassport(
                                                                    passport.expiryDate,
                                                                    passport.passportNumber,
                                                                    passport.country,
                                                                    passport.issuedDate
                                                                );
                                                                return (
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <span className="font-bold text-slate-500">STATUS:</span>
                                                                        {status.status === 'VALID' ? (
                                                                            <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12} /> Valid ({status.validityDays} days)</span>
                                                                        ) : (
                                                                            <span className="text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12} /> Expired/Warning</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => setPassports([...passports, {
                                                    passportNumber: '',
                                                    country: 'Sri Lanka',
                                                    issuedDate: '',
                                                    expiryDate: '',
                                                    status: PassportStatus.VALID,
                                                    validityDays: 0
                                                }])}
                                                className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold flex items-center justify-center gap-2 mt-2 transition-colors border border-blue-200 border-dashed"
                                            >
                                                <Plus size={16} /> Add Another Passport
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Address *</label>
                                    <textarea
                                        // FRICTIONLESS: Required removed
                                        rows={2}
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Province</label>
                                        <input
                                            type="text"
                                            value={formData.province}
                                            onChange={(e) => handleInputChange('province', e.target.value)}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Divisional Secretariat</label>
                                        <input
                                            type="text"
                                            value={formData.divisionalSecretariat}
                                            onChange={(e) => handleInputChange('divisionalSecretariat', e.target.value)}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GS Division</label>
                                        <input
                                            type="text"
                                            value={formData.gsDivision}
                                            onChange={(e) => handleInputChange('gsDivision', e.target.value)}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">District</label>
                                        <input
                                            type="text"
                                            value={formData.district}
                                            onChange={(e) => handleInputChange('district', e.target.value)}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">ID No (NIC)</label>
                                        <input
                                            type="text"
                                            value={formData.nic}
                                            onChange={(e) => handleInputChange('nic', e.target.value)}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Driving License No</label>
                                        <input
                                            type="text"
                                            value={formData.drivingLicenseNo}
                                            onChange={(e) => handleInputChange('drivingLicenseNo', e.target.value)}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Age / DOB</label>
                                        <input
                                            type="date"
                                            value={formData.dob}
                                            onChange={(e) => handleInputChange('dob', e.target.value)}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Place of Birth</label>
                                        <input
                                            type="text"
                                            value={formData.placeOfBirth}
                                            onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                                            placeholder="e.g. KEGALLA"
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">National Status</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={(e) => handleInputChange('nationality', e.target.value)}
                                            placeholder="SRI LANKAN"
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Profession (on Passport)</label>
                                        <input
                                            type="text"
                                            value={formData.passportProfession}
                                            onChange={(e) => handleInputChange('passportProfession', e.target.value)}
                                            placeholder="e.g. HEAVY VEHICLE DRIVER"
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                </div>

                                {/* Contact Information - Integrated Multi-Phone Input */}
                                <div className="space-y-4">
                                    <MultiPhoneInput
                                        primaryPhone={formData.phone || ''}
                                        whatsappPhone={formData.whatsapp || ''}
                                        additionalPhones={additionalContacts}
                                        onPrimaryPhoneChange={(value) => {
                                            handleInputChange('phone', value);
                                            // Robust sync for WhatsApp
                                            if (!formData.whatsapp || formData.whatsapp === formData.phone) {
                                                handleInputChange('whatsapp', value);
                                            }
                                        }}
                                        onWhatsappPhoneChange={(value) => handleInputChange('whatsapp', value)}
                                        onAdditionalPhonesChange={setAdditionalContacts}
                                        onDuplicateDetected={(phone, type) => {
                                            console.log(`Duplicate detected: ${phone} (${type})`);
                                        }}
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1 italic">
                                        Note: Primary phone and WhatsApp will be cross-referenced for duplicates.
                                    </p>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Height (FT)</label>
                                        <input
                                            type="number"
                                            value={formData.height?.feet || 0}
                                            onChange={(e) => handleNestedChange('height', 'feet', parseInt(e.target.value))}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Height (IN)</label>
                                        <input
                                            type="number"
                                            value={formData.height?.inches || 0}
                                            onChange={(e) => handleNestedChange('height', 'inches', parseInt(e.target.value))}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Weight (KG)</label>
                                        <input
                                            type="number"
                                            value={formData.weight || 0}
                                            onChange={(e) => handleInputChange('weight', parseInt(e.target.value))}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Religion</label>
                                        <select
                                            value={formData.religion}
                                            onChange={(e) => handleInputChange('religion', e.target.value)}
                                            disabled={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        >
                                            <option value="">Select Religion</option>
                                            <option value="Sinhala">Sinhala</option>
                                            <option value="Tamil">Tamil</option>
                                            <option value="Muslim">Muslim</option>
                                            <option value="Christian">Christian</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Marital Status</label>
                                        <select
                                            value={formData.maritalStatus}
                                            onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                                            disabled={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        >
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Divorced">Divorced</option>
                                            <option value="Widowed">Widowed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">School</label>
                                        <input
                                            type="text"
                                            value={formData.school}
                                            onChange={(e) => handleInputChange('school', e.target.value)}
                                            readOnly={!canEditPersonal}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* STEP 2: PROFESSIONAL & FAMILY */}
                    {currentStep === 2 && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">



                            {/* SECTION 1.6: PCC TRACKING */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between border-b-2 border-purple-600 pb-2">
                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                        Police Clearance Certificate (PCC)
                                    </h2>
                                    {!canEditCompliance && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase border border-slate-200">
                                            <ShieldAlert size={12} /> Read-only (Stage: {formData.stage})
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                                PCC Issued Date
                                            </label>
                                            <input
                                                type="date"
                                                value={pccIssuedDate}
                                                onChange={(e) => setPccIssuedDate(e.target.value)}
                                                readOnly={!canEditCompliance}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${!canEditCompliance ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                            />
                                            {pccIssuedDate && (() => {
                                                const evaluation = ComplianceService.evaluatePCC(pccIssuedDate);
                                                return (
                                                    <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase w-fit ${evaluation.status === PCCStatus.VALID ? 'bg-green-50 text-green-700 border border-green-200' :
                                                        evaluation.status === PCCStatus.EXPIRING ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                            'bg-red-50 text-red-700 border border-red-200'
                                                        }`}>
                                                        {evaluation.status === PCCStatus.VALID ? <ShieldCheck size={12} /> :
                                                            evaluation.status === PCCStatus.EXPIRING ? <ShieldCheck size={12} className="text-yellow-500" /> :
                                                                <ShieldAlert size={12} />}
                                                        {evaluation.status} • {evaluation.ageDays} Days Old
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                                Last Inspection Date
                                            </label>
                                            <input
                                                type="date"
                                                value={pccLastInspectionDate}
                                                onChange={(e) => setPccLastInspectionDate(e.target.value)}
                                                readOnly={!canEditCompliance}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${!canEditCompliance ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Auto-calculated PCC Status */}
                                    {pccIssuedDate && (
                                        <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
                                            {(() => {
                                                const pcc = ComplianceService.evaluatePCC(pccIssuedDate, pccLastInspectionDate);
                                                return (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-600 uppercase">PCC Status:</span>
                                                        <div className="flex items-center gap-2">
                                                            {pcc.status === 'VALID' && (
                                                                <>
                                                                    <CheckCircle size={16} className="text-green-600" />
                                                                    <span className="text-sm font-bold text-green-700">
                                                                        VALID ({pcc.ageDays} days old)
                                                                    </span>
                                                                </>
                                                            )}
                                                            {pcc.status === 'EXPIRING' && (
                                                                <>
                                                                    <AlertCircle size={16} className="text-yellow-600" />
                                                                    <span className="text-sm font-bold text-yellow-700">
                                                                        EXPIRING SOON ({pcc.ageDays} days old)
                                                                    </span>
                                                                </>
                                                            )}
                                                            {pcc.status === 'EXPIRED' && (
                                                                <>
                                                                    <X size={16} className="text-red-600" />
                                                                    <span className="text-sm font-bold text-red-700">
                                                                        EXPIRED ({pcc.ageDays} days old)
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* SECTION 1.7: PREFERRED COUNTRIES */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-indigo-600 pb-2">
                                    Preferred Countries
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <PreferredCountriesSelector
                                        label="Europe Preferences"
                                        allowedRegions={['Europe']}
                                        selectedCountries={preferredCountries}
                                        onChange={setPreferredCountries}
                                    />
                                    <PreferredCountriesSelector
                                        label="Middle East Preferences"
                                        allowedRegions={['Middle East']}
                                        selectedCountries={preferredCountries}
                                        onChange={setPreferredCountries}
                                    />
                                    <PreferredCountriesSelector
                                        label="Southeast Asia Preferences"
                                        allowedRegions={['Southeast Asia']}
                                        selectedCountries={preferredCountries}
                                        onChange={setPreferredCountries}
                                    />
                                </div>
                            </section>

                            {/* SECTION 1.8: PROFESSIONAL JOB ROLES */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-orange-600 pb-2">
                                    Professional Experience & Job Roles
                                </h2>

                                <JobRoleEntry
                                    jobRoles={jobRoles}
                                    onChange={setJobRoles}
                                />
                            </section>

                            {/* SECTION 2: EDUCATION */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                                    Educational / Professional Qualifications
                                </h2>

                                {/* Education Multi-Select */}
                                <div className="mb-6">
                                    <MultiEducationSelector
                                        selectedEducation={selectedEducation}
                                        onChange={setSelectedEducation}
                                        required={false} // FRICTIONLESS
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GCE O/L (Year)</label>
                                        <input
                                            type="text"
                                            value={formData.gceOL?.year || ''}
                                            onChange={(e) => handleNestedChange('gceOL', 'year', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GCE A/L (Year)</label>
                                        <input
                                            type="text"
                                            value={formData.gceAL?.year || ''}
                                            onChange={(e) => handleNestedChange('gceAL', 'year', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">#</th>
                                                <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Course Name (with NVQ / SLQF Level)</th>
                                                <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Institute/Campus</th>
                                                <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Year</th>
                                                <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {educationRows.map((row, index) => (
                                                <tr key={`edu-${index}`} className="border-t border-slate-100">
                                                    <td className="px-3 py-2 text-sm">{index + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.courseName}
                                                            onChange={(e) => {
                                                                const updated = [...educationRows];
                                                                updated[index].courseName = e.target.value;
                                                                setEducationRows(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-slate-200 rounded"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.institute}
                                                            onChange={(e) => {
                                                                const updated = [...educationRows];
                                                                updated[index].institute = e.target.value;
                                                                setEducationRows(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-slate-200 rounded"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.year}
                                                            onChange={(e) => {
                                                                const updated = [...educationRows];
                                                                updated[index].year = e.target.value;
                                                                setEducationRows(updated);
                                                            }}
                                                            className="w-full px-2 py-1 border border-slate-200 rounded"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEducationRow(index)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        type="button"
                                        onClick={addEducationRow}
                                        className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                                    >
                                        <Plus size={16} /> Add Row
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Training Details (Related to the Position)</label>
                                    <textarea
                                        rows={2}
                                        value={formData.trainingDetails}
                                        onChange={(e) => handleInputChange('trainingDetails', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </section>

                            {/* SECTION 3: PROFESSIONAL EXPERIENCE */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                                    Professional Experience
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 mb-2">LOCAL</h3>
                                        <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Position</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Company & Country</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Years</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employmentRows.local.map((row, index) => (
                                                    <tr key={`local-${index}`} className="border-t border-slate-100">
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={row.position}
                                                                onChange={(e) => {
                                                                    const updated = [...employmentRows.local];
                                                                    updated[index].position = e.target.value;
                                                                    setEmploymentRows({ ...employmentRows, local: updated });
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={row.companyName}
                                                                onChange={(e) => {
                                                                    const updated = [...employmentRows.local];
                                                                    updated[index].companyName = e.target.value;
                                                                    setEmploymentRows({ ...employmentRows, local: updated });
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={row.years}
                                                                onChange={(e) => {
                                                                    const updated = [...employmentRows.local];
                                                                    updated[index].years = parseInt(e.target.value);
                                                                    setEmploymentRows({ ...employmentRows, local: updated });
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEmploymentRow('local', index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button
                                            type="button"
                                            onClick={() => addEmploymentRow('local')}
                                            className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                                        >
                                            <Plus size={16} /> Add Local Employment
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 mb-2">FOREIGN</h3>
                                        <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Position</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Company</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Country</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Years</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employmentRows.foreign.map((row, index) => (
                                                    <tr key={`foreign-${index}`} className="border-t border-slate-100">
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={row.position}
                                                                onChange={(e) => {
                                                                    const updated = [...employmentRows.foreign];
                                                                    updated[index].position = e.target.value;
                                                                    setEmploymentRows({ ...employmentRows, foreign: updated });
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={row.companyName}
                                                                onChange={(e) => {
                                                                    const updated = [...employmentRows.foreign];
                                                                    updated[index].companyName = e.target.value;
                                                                    setEmploymentRows({ ...employmentRows, foreign: updated });
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={row.country}
                                                                onChange={(e) => {
                                                                    const updated = [...employmentRows.foreign];
                                                                    updated[index].country = e.target.value;
                                                                    setEmploymentRows({ ...employmentRows, foreign: updated });
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={row.years}
                                                                onChange={(e) => {
                                                                    const updated = [...employmentRows.foreign];
                                                                    updated[index].years = parseInt(e.target.value);
                                                                    setEmploymentRows({ ...employmentRows, foreign: updated });
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEmploymentRow('foreign', index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button
                                            type="button"
                                            onClick={() => addEmploymentRow('foreign')}
                                            className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                                        >
                                            <Plus size={16} /> Add Foreign Employment
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Special Achievements</label>
                                    <textarea
                                        rows={2}
                                        value={formData.specialAchievements}
                                        onChange={(e) => handleInputChange('specialAchievements', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </section>

                            {/* SECTION 4: FAMILY INFORMATION */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                                    Family Information
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Father's Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.fatherName}
                                            onChange={(e) => handleInputChange('fatherName', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mother's Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.motherName}
                                            onChange={(e) => handleInputChange('motherName', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Wife/Husband/Guardian's Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.guardianName}
                                            onChange={(e) => handleInputChange('guardianName', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">No of Children</label>
                                        <input
                                            type="number"
                                            value={formData.numberOfChildren || 0}
                                            onChange={(e) => handleInputChange('numberOfChildren', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian ID No</label>
                                        <input
                                            type="text"
                                            value={formData.guardianIdNo}
                                            onChange={(e) => handleInputChange('guardianIdNo', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian Birthday</label>
                                        <input
                                            type="date"
                                            value={formData.guardianBirthday}
                                            onChange={(e) => handleInputChange('guardianBirthday', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Guardian Contact No</label>
                                        <input
                                            type="tel"
                                            value={formData.guardianContact}
                                            onChange={(e) => handleInputChange('guardianContact', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {(formData.numberOfChildren || 0) > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 mb-2">Children Details</h3>
                                        <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">#</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Child's Name</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">M/F</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase">Age</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {childrenRows.map((row, index) => (
                                                    <tr key={`child-${index}`} className="border-t border-slate-100">
                                                        <td className="px-3 py-2 text-sm">{index + 1}</td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={row.name}
                                                                onChange={(e) => {
                                                                    const updated = [...childrenRows];
                                                                    updated[index].name = e.target.value;
                                                                    setChildrenRows(updated);
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <select
                                                                value={row.gender}
                                                                onChange={(e) => {
                                                                    const updated = [...childrenRows];
                                                                    updated[index].gender = e.target.value as 'M' | 'F';
                                                                    setChildrenRows(updated);
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            >
                                                                <option value="M">M</option>
                                                                <option value="F">F</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="number"
                                                                value={row.age}
                                                                onChange={(e) => {
                                                                    const updated = [...childrenRows];
                                                                    updated[index].age = parseInt(e.target.value);
                                                                    setChildrenRows(updated);
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-200 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeChildRow(index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button
                                            type="button"
                                            onClick={addChildRow}
                                            className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold"
                                        >
                                            <Plus size={16} /> Add Child
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {/* STEP 3: MEDICAL, COMPLIANCE & FINALIZE */}
                    {currentStep === 3 && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* SECTION 5: MEDICAL INFORMATION */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-red-600 pb-2">
                                    Medical Information
                                </h2>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                    <MedicalStatusInput
                                        status={medicalStatus}
                                        scheduledDate={medicalScheduledDate}
                                        completedDate={medicalCompletedDate}
                                        bloodGroup={medicalBloodGroup}
                                        allergies={medicalAllergies}
                                        notes={medicalNotes}
                                        onStatusChange={setMedicalStatus}
                                        onScheduledDateChange={setMedicalScheduledDate}
                                        onCompletedDateChange={setMedicalCompletedDate}
                                        onBloodGroupChange={setMedicalBloodGroup}
                                        onAllergiesChange={setMedicalAllergies}
                                        onNotesChange={setMedicalNotes}
                                    />
                                </div>
                            </section>

                            {/* OFFICE USE ONLY */}
                            <section className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 space-y-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                    Office Use Only
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Customer Care Officer</label>
                                        <input
                                            type="text"
                                            value={formData.officeUseOnly?.customerCareOfficer || ''}
                                            onChange={(e) => setFormData(p => ({ ...p, officeUseOnly: { ...p.officeUseOnly, customerCareOfficer: e.target.value } }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg w-full bg-white transition-all focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">File Handling Officer</label>
                                        <input
                                            type="text"
                                            value={formData.officeUseOnly?.fileHandlingOfficer || ''}
                                            onChange={(e) => setFormData(p => ({ ...p, officeUseOnly: { ...p.officeUseOnly, fileHandlingOfficer: e.target.value } }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg w-full bg-white transition-all focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={formData.officeUseOnly?.date || ''}
                                            onChange={(e) => setFormData(p => ({ ...p, officeUseOnly: { ...p.officeUseOnly, date: e.target.value } }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg w-full bg-white transition-all focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Charges</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1350000 + Ticket + Medical"
                                            value={formData.officeUseOnly?.charges || ''}
                                            onChange={(e) => setFormData(p => ({ ...p, officeUseOnly: { ...p.officeUseOnly, charges: e.target.value } }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg w-full bg-white transition-all focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    {/* Selection and Remark from legacy */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Selection</label>
                                        <select
                                            value={formData.officeSelection || 'Select'}
                                            onChange={(e) => handleInputChange('officeSelection', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg w-full bg-white transition-all focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Select">Select</option>
                                            <option value="Reject">Reject</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Remark</label>
                                        <input
                                            type="text"
                                            value={formData.officeRemark || ''}
                                            onChange={(e) => handleInputChange('officeRemark', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg w-full bg-white transition-all focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </section>

                        </div>
                    )}

                    {/* STEP NAVIGATION */}
                    <div className="flex items-center justify-between pt-12 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/candidates')}
                            className="flex items-center gap-2 px-8 py-4 border-2 border-slate-300 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} />
                            {currentStep === 1 ? 'Cancel Entry' : 'Back to Step 0' + (currentStep - 1)}
                        </button>

                        <div className="flex items-center gap-4">
                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="flex items-center gap-2 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 group"
                                >
                                    Proceed to Next Step
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    <ShieldCheck size={20} />
                                    Finalize & Submit Application
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DigitalApplicationForm;
