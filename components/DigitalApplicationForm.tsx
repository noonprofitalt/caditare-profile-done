import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Candidate, WorkflowStage, StageStatus, MedicalStatus, Country, JobRole, ProfileCompletionStatus, RegistrationSource, PassportData, PassportStatus, PCCStatus } from '../types';
import { CandidateService } from '../services/candidateService';
import { ComplianceService } from '../services/complianceService';
import { WORKFLOW_STAGES } from '../services/workflowEngine.v2';
import { ProfileCompletionService } from '../services/profileCompletionService';
import { NICService } from '../services/nicService';
import { Plus, Trash2, Save, X, AlertCircle, CheckCircle, Calendar, FileEdit, TrendingUp, ShieldCheck, ShieldAlert } from 'lucide-react';
import MultiSelect from './ui/MultiSelect';
import PreferredCountriesSelector from './ui/PreferredCountriesSelector';
import MultiPhoneInput from './ui/MultiPhoneInput';
import MultiEducationSelector from './ui/MultiEducationSelector';
import MedicalStatusInput from './ui/MedicalStatusInput';
import { TemplateService } from '../services/templateService';
import { ProfileMergeService } from '../services/profileMergeService';
import { NotificationService } from '../services/notificationService';
import JobRoleEntry from './JobRoleEntry';

const DigitalApplicationForm: React.FC = () => {
    const navigate = useNavigate();
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
        firstName: '',
        middleName: '',
        name: '', // Will be constructed
        address: '',
        nic: '',
        dob: '',
        phone: '',
        whatsapp: '',
        email: '',

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
        documents: []
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

    // Load existing candidate data if in upgrade mode
    useEffect(() => {
        if (upgradeId) {
            const candidate = CandidateService.getCandidateById(upgradeId);
            if (candidate) {
                setIsUpgradeMode(true);
                setExistingCandidate(candidate);

                // Pre-fill form data
                setFormData({
                    ...candidate,
                    firstName: candidate.firstName || candidate.name.split(' ')[0],
                    middleName: candidate.middleName || '',
                    name: candidate.name, // Explicitly set Full Name
                });

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
                if (candidate.additionalContactNumbers) setAdditionalContacts(candidate.additionalContactNumbers);

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
    }, [upgradeId]);

    // --- Workflow Guarding Helpers ---
    const currentStageIndex = WORKFLOW_STAGES.indexOf(formData.stage || WorkflowStage.REGISTERED);
    const isStageAtLeast = (stage: WorkflowStage) => {
        return currentStageIndex >= WORKFLOW_STAGES.indexOf(stage);
    };

    const canEditPersonal = !isUpgradeMode || !isStageAtLeast(WorkflowStage.APPLIED);
    const canEditCompliance = !isUpgradeMode || !isStageAtLeast(WorkflowStage.VISA_RECEIVED);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInputChange = (field: string, value: any) => {
        const personalFields = ['firstName', 'middleName', 'name', 'nic', 'drivingLicenseNo', 'dob'];
        if (personalFields.includes(field) && !canEditPersonal) return; // Guard

        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Smart NIC Parsing
            if (field === 'nic') {
                const parsed = NICService.parseNIC(value);
                if (parsed) {
                    updated.dob = parsed.dob;
                    updated.gender = parsed.gender;
                }
            }

            return updated;
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNestedChange = (field: string, nestedField: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Compile employment history
        const employmentHistory = [
            ...employmentRows.local.map(row => ({ ...row, type: 'Local' as const })),
            ...employmentRows.foreign.map(row => ({ ...row, type: 'Foreign' as const }))
        ];

        // Create candidate data
        // Priority: Recalculated from components > typed in name field
        const compName = `${formData.firstName || ''} ${formData.middleName ? formData.middleName + ' ' : ''}`.trim();
        const constructedName = compName || formData.name?.trim() || '';

        // Construct PCC Data
        const pccData = pccIssuedDate ? {
            issuedDate: pccIssuedDate,
            lastInspectionDate: pccLastInspectionDate,
            status: PCCStatus.VALID, // Placeholder, will rely on backend/service to recalculate status
            ageDays: 0 // Placeholder
        } : undefined;

        const candidateData: Partial<Candidate> = {
            ...formData,
            name: constructedName,
            educationalQualifications: educationRows,
            employmentHistory,
            children: childrenRows,
            role: formData.position || 'General Worker',
            location: formData.district || '',
            preferredCountries: preferredCountries,
            education: selectedEducation,
            jobRoles: jobRoles,
            additionalContactNumbers: additionalContacts,
            passports,
            passportData: passports.length > 0 ? passports[0] : undefined, // Main passport for backward compat
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
            }
        };

        if (isUpgradeMode && existingCandidate) {
            // UPGRADE MODE: Safely merge using the service
            const updatedCandidate = ProfileMergeService.mergeProfiles(existingCandidate, candidateData);

            CandidateService.updateCandidate(updatedCandidate);
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
                id: `candidate-${Date.now()}`,
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
                    actor: 'Staff User',
                    stage: WorkflowStage.REGISTERED
                }],
                documents: [],
                registrationSource: RegistrationSource.FULL_FORM
            };

            // Calculate profile completion
            const completionData = ProfileCompletionService.updateCompletionData(newCandidate);
            const finalCandidate = { ...newCandidate, ...completionData };

            CandidateService.addCandidate(finalCandidate);
            navigate('/candidates');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">Suhara Foreign Employment Agency</h1>
                            <p className="text-blue-100 text-sm mt-1">Application Form - Digital Version</p>
                        </div>
                        <button
                            onClick={() => navigate('/candidates')}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-200 block">Date:</span>
                            <input
                                type="date"
                                value={formData.applicationDate}
                                onChange={(e) => handleInputChange('applicationDate', e.target.value)}
                                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-blue-200 w-full mt-1"
                            />
                        </div>
                        <div>
                            <span className="text-blue-200 block">Country:</span>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-blue-200 w-full mt-1"
                                placeholder="Target Country"
                            />
                        </div>
                        <div>
                            <span className="text-blue-200 block">Position:</span>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => handleInputChange('position', e.target.value)}
                                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-blue-200 w-full mt-1"
                                placeholder="Desired Position"
                            />
                        </div>
                    </div>
                </div>

                {/* PROFILE COMPLETION BANNER */}
                {(() => {
                    const currentCompletion = ProfileCompletionService.calculateCompletionPercentage({
                        ...formData,
                        educationalQualifications: educationRows,
                        employmentHistory: [
                            ...employmentRows.local.map(row => ({ ...row, type: 'Local' as const })),
                            ...employmentRows.foreign.map(row => ({ ...row, type: 'Foreign' as const }))
                        ],
                        children: childrenRows,
                        education: selectedEducation,
                        jobRoles: jobRoles,
                        additionalContactNumbers: additionalContacts,
                        passports,
                        pccData: pccIssuedDate ? { issuedDate: pccIssuedDate, status: PCCStatus.VALID, ageDays: 0 } : undefined,
                        stageData: { ...formData.stageData, medicalStatus }
                    });

                    return (
                        <div className={`p-4 transition-colors duration-500 ${currentCompletion === 100 ? 'bg-green-600' : 'bg-gradient-to-r from-blue-600 to-blue-800'} text-white`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {currentCompletion === 100 ? <CheckCircle size={24} /> : <TrendingUp size={24} />}
                                    <div>
                                        <h3 className="font-bold text-sm uppercase tracking-wider">
                                            {isUpgradeMode ? 'Upgrading Profile' : 'Application Progress'}
                                        </h3>
                                        <p className="text-xs text-blue-100 italic">
                                            {currentCompletion}% Complete • {currentCompletion < 100 ? 'Keep going to reach 100%' : 'Excellent! Your profile is fully complete!'}
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden md:block text-right">
                                    <span className="text-[10px] uppercase font-black opacity-50 block">Profile Score</span>
                                    <span className="text-xl font-black">{currentCompletion}/100</span>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-3 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-700 ease-out"
                                    style={{ width: `${currentCompletion}%` }}
                                />
                            </div>
                        </div>
                    );
                })()}

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* SECTION 1: PERSONAL DETAILS */}
                    <section className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b-2 border-blue-600 pb-2">
                            Personal Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">First Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName || ''}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Middle Name</label>
                                <input
                                    type="text"
                                    value={formData.middleName || ''}
                                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter full name exactly as it should appear"
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
                                required
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

                        {/* Contact Information - Integrated Multi-Phone Input */}
                        <div className="space-y-4">
                            <MultiPhoneInput
                                primaryPhone={formData.phone || ''}
                                whatsappPhone={formData.whatsapp || ''}
                                additionalPhones={additionalContacts}
                                onPrimaryPhoneChange={(value) => {
                                    handleInputChange('phone', value);
                                    if (formData.whatsapp === formData.phone) {
                                        handleInputChange('whatsapp', value);
                                    }
                                }}
                                onWhatsappPhoneChange={(value) => handleInputChange('whatsapp', value)}
                                onAdditionalPhonesChange={setAdditionalContacts}
                                onDuplicateDetected={(phone, type) => {
                                    console.log(`Duplicate detected: ${phone} (${type})`);
                                }}
                            />

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
                                <input
                                    type="text"
                                    value={formData.religion}
                                    onChange={(e) => handleInputChange('religion', e.target.value)}
                                    readOnly={!canEditPersonal}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEditPersonal ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                />
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

                    {/* SECTION 1.5: MEDICAL STATUS WORKFLOW */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-green-600 pb-2">
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                Medical Status
                            </h2>
                            {!canEditCompliance && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase border border-slate-200">
                                    <ShieldAlert size={12} /> Read-only (Stage: {formData.stage})
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Medical Status
                                    </label>
                                    <select
                                        value={medicalStatus}
                                        onChange={(e) => setMedicalStatus(e.target.value as MedicalStatus)}
                                        disabled={!canEditCompliance}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${!canEditCompliance ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                    >
                                        <option value={MedicalStatus.NOT_STARTED}>Not Started</option>
                                        <option value={MedicalStatus.SCHEDULED}>Scheduled</option>
                                        <option value={MedicalStatus.COMPLETED}>Completed</option>
                                        <option value={MedicalStatus.FAILED}>Failed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        Scheduled Date
                                    </label>
                                    <input
                                        type="date"
                                        value={medicalScheduledDate}
                                        onChange={(e) => setMedicalScheduledDate(e.target.value)}
                                        readOnly={!canEditCompliance}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${!canEditCompliance ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'}`}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Medical Notes (Optional)
                                </label>
                                <textarea
                                    value={medicalNotes}
                                    onChange={(e) => setMedicalNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Any additional medical information..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                        </div>
                    </section>

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
                                label="Middle East (GCC) Preferences"
                                allowedRegions={['Middle East (GCC)']}
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
                                required={true}
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
                                        <tr key={`edu-${row.courseName || 'new'}-${row.year || 'year'}-${index}`} className="border-t border-slate-100">
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
                                            <tr key={`local-${row.position || 'new'}-${row.companyName || 'company'}-${index}`} className="border-t border-slate-100">
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
                                            <tr key={`foreign-${row.position || 'new'}-${row.country || 'country'}-${index}`} className="border-t border-slate-100">
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
                                            <tr key={`child-${row.name || 'new'}-${row.age || 0}-${index}`} className="border-t border-slate-100">
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
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Selection</label>
                                <select
                                    value={formData.officeSelection || 'Select'}
                                    onChange={(e) => handleInputChange('officeSelection', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                >
                                    <option value="Select">Select</option>
                                    <option value="Reject">Reject</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Remark</label>
                                <input
                                    type="text"
                                    value={formData.officeRemark}
                                    onChange={(e) => handleInputChange('officeRemark', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SUBMIT */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate('/candidates')}
                            className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 text-white font-extrabold rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <Save size={20} /> Submit Application
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DigitalApplicationForm;
