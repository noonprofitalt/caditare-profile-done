import React, { useState } from 'react';
import { Candidate, StageData, DocumentType, DocumentStatus, PaymentRecord, JobRole, Country, SLBFEData, BiometricStatus, PassportData, PassportStatus } from '../types';
import { TemplateService } from '../services/templateService';
import PreferredCountriesSelector from './ui/PreferredCountriesSelector';
import { X, Save, User, Briefcase, Globe, Activity, FileText, CreditCard, Plus, Trash2, ChevronDown, Check, ShieldCheck } from 'lucide-react';

interface CandidateFormProps {
  initialData?: Partial<Candidate>;
  onSubmit: (data: Partial<Candidate>) => void;
  onClose: () => void;
  title: string;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ initialData, onSubmit, onClose, title }) => {
  // Safe defaults for controlled inputs
  const splitName = initialData?.name ? initialData.name.split(' ') : ['', '', ''];
  const defaultFirstName = initialData?.firstName || splitName[0];
  const defaultMiddleName = initialData?.middleName || (splitName.length > 1 ? splitName.slice(1).join(' ') : '');

  // Document Status Defaults
  const passportPhotosDoc = initialData?.documents?.find(d => d.type === DocumentType.PASSPORT_PHOTOS);
  const fullPhotoDoc = initialData?.documents?.find(d => d.type === DocumentType.FULL_PHOTO);

  // Form State
  const [formData, setFormData] = useState({
    firstName: defaultFirstName,
    middleName: defaultMiddleName,
    nic: initialData?.nic || '',
    dob: initialData?.dob || '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    secondaryPhone: initialData?.secondaryPhone || (initialData?.additionalContactNumbers && initialData.additionalContactNumbers.length > 0 ? initialData.additionalContactNumbers[0] : ''),
    whatsapp: initialData?.whatsapp || initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    city: initialData?.city || initialData?.location || initialData?.district || '',
    education: Array.isArray(initialData?.education) ? initialData.education : (initialData?.education ? [initialData.education] : []),

    // Professional & Operational (Preserved)
    role: initialData?.role || '',
    location: initialData?.location || '', // Will sync with City
    experienceYears: initialData?.experienceYears || 0,
    skills: initialData?.skills?.join(', ') || '',
    preferredCountries: initialData?.preferredCountries || [],
    jobRoles: initialData?.jobRoles || [], // Dynamic Job Roles

    // Stage Data
    employerStatus: initialData?.stageData?.employerStatus || 'Pending',
    medicalStatus: initialData?.stageData?.medicalStatus || 'Pending',
    medicalScheduledDate: initialData?.stageData?.medicalScheduledDate || '',
    policeStatus: initialData?.stageData?.policeStatus || 'Pending',
    visaStatus: initialData?.stageData?.visaStatus || 'Pending',
    paymentStatus: initialData?.stageData?.paymentStatus || 'Pending',
    paymentNotes: initialData?.stageData?.paymentNotes || '',

    // photo docs status
    passportPhotosStatus: passportPhotosDoc?.status || DocumentStatus.PENDING,
    fullPhotoStatus: fullPhotoDoc?.status || DocumentStatus.PENDING,
    targetCountry: initialData?.targetCountry || Country.SAUDI_ARABIA,

    // SLBFE Data (Flattened for form, will reconstruct)
    slbfeRegNo: initialData?.slbfeData?.registrationNumber || '',
    slbfeRegDate: initialData?.slbfeData?.registrationDate || '',
    trainingDate: initialData?.slbfeData?.trainingDate || '',
    insurancePolicyNo: initialData?.slbfeData?.insurancePolicyNumber || '',
    insuranceExpiryDate: initialData?.slbfeData?.insuranceExpiryDate || '',
    biometricStatus: initialData?.slbfeData?.biometricStatus || BiometricStatus.PENDING,
    familyConsentGiven: initialData?.slbfeData?.familyConsent?.isGiven || false,
    agreementStatus: initialData?.slbfeData?.agreementStatus || 'Pending',
    spouseName: initialData?.spouseName || '',
    passports: initialData?.passports || [],
    officeUseOnly: initialData?.officeUseOnly || { customerCareOfficer: '', fileHandlingOfficer: '', date: '', charges: '' },
  });

  // Re-added missing states for JSX compatibility
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(initialData?.stageData?.paymentHistory || []);
  const [newPayment, setNewPayment] = useState({ date: '', amount: '', notes: '' });
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(!!initialData?.secondaryPhone);
  const [jobRoles, setJobRoles] = useState<JobRole[]>(
    (initialData?.jobRoles || []).map(r => typeof r === 'string' ? { title: r, experienceYears: 0, skillLevel: 'Skilled' } : r)
  );
  const [newJobRole, setNewJobRole] = useState<JobRole>({ title: '', experienceYears: 0, skillLevel: 'Skilled', notes: '' });
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showEducationDropdown, setShowEducationDropdown] = useState(false);

  const age = React.useMemo(() => {
    if (!formData.dob) return '';
    const birthDate = new Date(formData.dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge.toString();
  }, [formData.dob]);

  const handleAddPayment = () => {
    if (!newPayment.amount || !newPayment.date) return;
    const record: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date: newPayment.date,
      amount: newPayment.amount,
      notes: newPayment.notes
    };
    setPaymentHistory([...paymentHistory, record]);
    setNewPayment({ date: '', amount: '', notes: '' });
  };

  const handleRemovePayment = (id: string) => {
    setPaymentHistory(paymentHistory.filter(p => p.id !== id));
  };

  const handleAddPassport = () => {
    setFormData(prev => ({
      ...prev,
      passports: [
        ...prev.passports,
        {
          passportNumber: '',
          country: Country.SAUDI_ARABIA, // Default
          issuedDate: '',
          expiryDate: '',
          status: PassportStatus.VALID,
          validityDays: 0
        }
      ]
    }));
  };

  const handleRemovePassport = (index: number) => {
    setFormData(prev => ({
      ...prev,
      passports: prev.passports.filter((_, i) => i !== index)
    }));
  };

  const handlePassportChange = (index: number, field: keyof PassportData, value: any) => {
    setFormData(prev => {
      const updatedPassports = [...prev.passports];
      updatedPassports[index] = { ...updatedPassports[index], [field]: value };
      return { ...prev, passports: updatedPassports };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stageDataUpdate: StageData = {
      ...initialData?.stageData,
      employerStatus: formData.employerStatus as StageData['employerStatus'],
      medicalStatus: formData.medicalStatus as StageData['medicalStatus'],
      medicalScheduledDate: formData.medicalStatus === 'Scheduled' ? formData.medicalScheduledDate : undefined,
      policeStatus: formData.policeStatus as StageData['policeStatus'],
      visaStatus: formData.visaStatus as StageData['visaStatus'],
      paymentStatus: formData.paymentStatus as StageData['paymentStatus'],
      paymentNotes: formData.paymentNotes,
      paymentHistory: paymentHistory,
    };

    // Update documents if in Edit Mode (initialData.documents exists)
    let updatedDocuments = initialData?.documents;
    if (updatedDocuments) {
      updatedDocuments = updatedDocuments.map(doc => {
        if (doc.type === DocumentType.PASSPORT_PHOTOS) {
          return { ...doc, status: formData.passportPhotosStatus as DocumentStatus };
        }
        if (doc.type === DocumentType.FULL_PHOTO) {
          return { ...doc, status: formData.fullPhotoStatus as DocumentStatus };
        }
        return doc;
      });
    }

    const slbfeDataUpdate: SLBFEData = {
      ...initialData?.slbfeData,
      registrationNumber: formData.slbfeRegNo,
      registrationDate: formData.slbfeRegDate,
      trainingDate: formData.trainingDate,
      insurancePolicyNumber: formData.insurancePolicyNo,
      insuranceExpiryDate: formData.insuranceExpiryDate,
      biometricStatus: formData.biometricStatus as BiometricStatus,
      familyConsent: {
        ...initialData?.slbfeData?.familyConsent,
        isGiven: formData.familyConsentGiven
      },
      agreementStatus: formData.agreementStatus as any
    };

    const processedData = {
      ...formData,
      // Reconstruct main name and location for compatibility
      name: `${formData.firstName} ${formData.middleName || ''}`.trim(),
      location: formData.city ? `${formData.city}, ${formData.address}` : formData.address,

      skills: formData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s),
      preferredCountries: formData.preferredCountries,
      jobRoles: jobRoles,
      slbfeData: slbfeDataUpdate,
      passports: formData.passports, // Include passports in submission
      documents: updatedDocuments, // Pass updated docs back
      officeUseOnly: formData.officeUseOnly,
    };

    onSubmit(processedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-blue-600" /> {title}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">

          {/* PERSONAL INFORMATION */}
          <div className="space-y-6">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4">
              Personal Information
            </h4>

            {/* Row 1: Name */}
            {/* Row 1: Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">First Name <span className="text-red-500">*</span></label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  // FRICTIONLESS: required removed
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Middle Name</label>
                <input
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 2: NIC & DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">NIC <span className="text-red-500">*</span></label>
                <input
                  name="nic"
                  value={formData.nic}
                  // FRICTIONLESS: required removed
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Age & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Age</label>
                <input
                  value={age}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Gender <span className="text-red-500">*</span></label>
                <select
                  name="gender"
                  value={formData.gender}
                  // FRICTIONLESS: required removed
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select your gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Row 4: Phones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Telephone Number <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    name="phone"
                    value={formData.phone}
                    // FRICTIONLESS: required removed
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, phone: val }));
                      // Auto-sync WhatsApp if it was matching phone
                      if (formData.whatsapp === formData.phone) {
                        setFormData(prev => ({ ...prev, whatsapp: val }));
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  />
                  {!showSecondaryPhone && (
                    <button
                      type="button"
                      onClick={() => setShowSecondaryPhone(true)}
                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Add Secondary Phone"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
                {showSecondaryPhone && (
                  <div className="flex gap-2 mt-2 animate-in slide-in-from-top-2 fade-in">
                    <input
                      name="secondaryPhone"
                      placeholder="Secondary Phone (Optional)"
                      value={formData.secondaryPhone}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowSecondaryPhone(false);
                        setFormData(prev => ({ ...prev, secondaryPhone: '' }));
                      }}
                      className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">WhatsApp Number <span className="text-red-500">*</span></label>
                <input
                  name="whatsapp"
                  value={formData.whatsapp}
                  // FRICTIONLESS: required removed
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 5: Email */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Row 6: Address */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Address Line <span className="text-red-500">*</span></label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Row 7: City */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">City <span className="text-red-500">*</span></label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Row 8: Education */}
            {/* Row 8: Education (Multi-Select) */}
            <div className="space-y-1 relative">
              <label className="text-sm font-semibold text-slate-700">Highest Education <span className="text-red-500">*</span></label>

              <div className="flex flex-wrap gap-2 mb-2">
                {Array.isArray(formData.education) && formData.education.map((edu: string) => (
                  <span key={edu} className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    {edu}
                    <button type="button" onClick={() => setFormData(p => ({ ...p, education: (p.education as string[]).filter(e => e !== edu) }))}>
                      <X size={12} className="hover:text-red-600" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEducationDropdown(!showEducationDropdown)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-left flex justify-between items-center text-sm"
                >
                  <span className={!formData.education || formData.education.length === 0 ? 'text-slate-400' : 'text-slate-800'}>
                    {!formData.education || formData.education.length === 0 ? 'Select Qualifications...' : 'Add more...'}
                  </span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>

                {showEducationDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {['G.C.E O/L', 'G.C.E A/L', 'Diploma', 'NVQ 3', 'NVQ 4', 'HND', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other']
                      .filter(e => !formData.education?.includes(e))
                      .map(edu => (
                        <div
                          key={edu}
                          onClick={() => {
                            const current = Array.isArray(formData.education) ? formData.education : [];
                            setFormData(p => ({ ...p, education: [...current, edu] }));
                            setShowEducationDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-slate-700 group flex items-center justify-between"
                        >
                          {edu}
                          <Check size={14} className="opacity-0 group-hover:opacity-100 text-emerald-600" />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PROFESSIONAL DETAILS (Preserving necessary system fields) */}
          <div className="space-y-6">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4">
              Professional Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Job Role</label>
                <input
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="e.g. Civil Engineer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Experience (Years)</label>
                <input
                  name="experienceYears"
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Skills (Comma separated)</label>
              <input
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4">
              Job & Preferences
            </h4>

            {/* Preferred Countries - Split Region */}
            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <h5 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-purple-600" /> Europe Preferences
                </h5>
                <PreferredCountriesSelector
                  label=""
                  allowedRegions={['Europe']}
                  selectedCountries={formData.preferredCountries}
                  onChange={(countries) => setFormData(p => ({ ...p, preferredCountries: countries }))}
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <h5 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-amber-600" /> Middle East Preferences
                </h5>
                <PreferredCountriesSelector
                  label=""
                  allowedRegions={['Middle East']}
                  selectedCountries={formData.preferredCountries}
                  onChange={(countries) => setFormData(p => ({ ...p, preferredCountries: countries }))}
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <h5 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-blue-600" /> Southeast Asia Preferences
                </h5>
                <PreferredCountriesSelector
                  label=""
                  allowedRegions={['Southeast Asia']}
                  selectedCountries={formData.preferredCountries}
                  onChange={(countries) => setFormData(p => ({ ...p, preferredCountries: countries }))}
                />
              </div>
            </div>

            {/* DYNAMIC JOB ROLES */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h5 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                Job Roles & Experience <Briefcase size={14} className="text-blue-600" />
              </h5>

              {jobRoles.map((role, idx) => (
                <div key={`role-${role.title}-${role.experienceYears}-${idx}`} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-12 gap-2 flex-1">
                    <div className="col-span-4">
                      <span className="text-xs font-semibold text-slate-500 block">Title</span>
                      <span className="text-sm font-medium text-slate-800">{role.title}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-semibold text-slate-500 block">Exp</span>
                      <span className="text-sm text-slate-800">{role.experienceYears}y</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-xs font-semibold text-slate-500 block">Level</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{role.skillLevel}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-xs font-semibold text-slate-500 block">Notes</span>
                      <span className="text-xs text-slate-600 truncate">{role.notes || '-'}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setJobRoles(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 items-end bg-blue-50/50 p-3 rounded-lg border border-blue-100 border-dashed">
                <div className="flex-1 grid grid-cols-12 gap-2">
                  <div className="col-span-4 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Title</label>
                    <input
                      value={newJobRole.title}
                      onChange={e => setNewJobRole(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded outline-none"
                      placeholder="Job Title"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Yrs</label>
                    <input
                      type="number"
                      value={newJobRole.experienceYears}
                      onChange={e => setNewJobRole(p => ({ ...p, experienceYears: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded outline-none"
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Level</label>
                    <select
                      value={newJobRole.skillLevel}
                      onChange={e => setNewJobRole(p => ({ ...p, skillLevel: e.target.value as JobRole['skillLevel'] }))}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded outline-none"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Skilled</option>
                      <option>Expert</option>
                    </select>
                  </div>
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Notes</label>
                    <input
                      value={newJobRole.notes}
                      onChange={e => setNewJobRole(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded outline-none"
                      placeholder="Opt..."
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (newJobRole.title) {
                      setJobRoles([...jobRoles, newJobRole]);
                      setNewJobRole({ title: '', experienceYears: 0, skillLevel: 'Skilled', notes: '' });
                    }
                  }}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Target Country <span className="text-red-500">*</span></label>
              <select
                name="targetCountry"
                value={formData.targetCountry}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {TemplateService.getCountries().map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">This will automatically generate the required document checklist for this region.</p>
            </div>
          </div>

          {/* REGISTRATION DOCUMENTS */}
          <div className="pt-2">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              Registration Documents <FileText size={12} />
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Passport Photos (6)</label>
                <select
                  name="passportPhotosStatus"
                  value={formData.passportPhotosStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {Object.values(DocumentStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Photo (1)</label>
                <select
                  name="fullPhotoStatus"
                  value={formData.fullPhotoStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {Object.values(DocumentStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Passports Section */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Valid Passports <ShieldCheck size={14} className="text-emerald-600" />
                </label>
                <button
                  type="button"
                  onClick={handleAddPassport}
                  className="text-white bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-colors"
                >
                  <Plus size={14} /> Add Passport
                </button>
              </div>

              <div className="space-y-3">
                {formData.passports && formData.passports.length > 0 ? (
                  formData.passports.map((passport, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                      <button
                        type="button"
                        onClick={() => handleRemovePassport(idx)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Passport No</label>
                          <input
                            value={passport.passportNumber}
                            onChange={(e) => handlePassportChange(idx, 'passportNumber', e.target.value)}
                            placeholder="N/A"
                            className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Country</label>
                          <select
                            value={passport.country}
                            onChange={(e) => handlePassportChange(idx, 'country', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded outline-none focus:border-blue-500"
                          >
                            {TemplateService.getCountries().map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Issued Date</label>
                          <input
                            type="date"
                            value={passport.issuedDate ? new Date(passport.issuedDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handlePassportChange(idx, 'issuedDate', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={passport.expiryDate ? new Date(passport.expiryDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handlePassportChange(idx, 'expiryDate', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <Globe size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500 mb-3">No passport details added.</p>
                    <button type="button" onClick={handleAddPassport} className="text-blue-600 font-semibold text-xs hover:underline">
                      Add Primary Passport
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OPERATIONAL STATUS */}
          <div className="pt-2">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              Operational Statuses <Activity size={12} />
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Employer Selection</label>
                <select
                  name="employerStatus"
                  value={formData.employerStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Medical Status</label>
                <select
                  name="medicalStatus"
                  value={formData.medicalStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Failed">Failed</option>
                </select>

                {formData.medicalStatus === 'Scheduled' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1 block">Appointment Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="medicalScheduledDate"
                      value={formData.medicalScheduledDate}
                      onChange={handleChange}
                      // FRICTIONLESS: required removed
                      className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Police Clearance</label>
                <select
                  name="policeStatus"
                  value={formData.policeStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Applied">Applied</option>
                  <option value="Issued">Issued</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Visa Status</label>
                <select
                  name="visaStatus"
                  value={formData.visaStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* PAYMENT DETAILS SECTION */}
          <div className="pt-2">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              Payment Details <CreditCard size={12} />
            </h4>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Overall Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">General Notes</label>
                  <input
                    name="paymentNotes"
                    value={formData.paymentNotes}
                    onChange={handleChange}
                    placeholder="Overall payment remarks..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Payment History Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-500 uppercase flex justify-between items-center">
                  <span>Payment History</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{paymentHistory.length} Records</span>
                </div>

                {/* List */}
                <div className="max-h-48 overflow-y-auto">
                  {paymentHistory.length > 0 ? (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Amount</th>
                          <th className="px-4 py-2">Notes</th>
                          <th className="px-4 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map(record => (
                          <tr key={record.id}>
                            <td className="px-4 py-2 text-slate-700">{record.date}</td>
                            <td className="px-4 py-2 font-mono font-medium text-slate-800">{record.amount}</td>
                            <td className="px-4 py-2 text-slate-500 text-xs truncate max-w-[150px]">{record.notes}</td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => handleRemovePayment(record.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-400 italic">No payments recorded yet.</div>
                  )}
                </div>

                {/* Add New Record */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={newPayment.date}
                      onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Amount</label>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Initial deposit"
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={handleAddPayment}
                      className="w-full flex items-center justify-center h-[34px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      title="Add Payment"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SLBFE COMPLIANCE SECTION */}
          <div className="pt-2">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              SLBFE Compliance <ShieldCheck size={12} />
            </h4>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Registration */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">SLBFE Registration No</label>
                <input
                  name="slbfeRegNo"
                  value={formData.slbfeRegNo}
                  onChange={handleChange}
                  placeholder="e.g. SLBFE/2026/XXXX"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Registration Date</label>
                <input
                  type="date"
                  name="slbfeRegDate"
                  value={formData.slbfeRegDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Training & Insurance */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Training Completion Date</label>
                <input
                  type="date"
                  name="trainingDate"
                  value={formData.trainingDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Insurance Policy No</label>
                <input
                  name="insurancePolicyNo"
                  value={formData.insurancePolicyNo}
                  onChange={handleChange}
                  placeholder="Policy Number"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Insurance Expiry Date</label>
                <input
                  type="date"
                  name="insuranceExpiryDate"
                  value={formData.insuranceExpiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Biometrics */}
              {/* Biometrics & Agreement */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Biometric Status</label>
                <select
                  name="biometricStatus"
                  value={formData.biometricStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {Object.values(BiometricStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Agreement Status</label>
                <select
                  name="agreementStatus"
                  value={formData.agreementStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {['Pending', 'Submitted', 'Approved', 'Rejected'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Family Consent (Checkbox style) */}
              <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="familyConsentGiven"
                    checked={formData.familyConsentGiven}
                    onChange={e => setFormData(p => ({ ...p, familyConsentGiven: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <label htmlFor="familyConsentGiven" className="text-sm font-bold text-slate-700 block cursor-pointer">Family Consent Verified</label>
                    <p className="text-xs text-slate-500">Required for female candidates in domestic sector roles.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* OFFICE USE ONLY SECTION */}
          <div className="space-y-6">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-2 mb-4">
              Office Use Only
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Customer Care Officer</label>
                <input
                  value={formData.officeUseOnly?.customerCareOfficer || ''}
                  onChange={(e) => setFormData(p => ({ ...p, officeUseOnly: { ...p.officeUseOnly, customerCareOfficer: e.target.value } }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">File Handling Officer</label>
                <input
                  value={formData.officeUseOnly?.fileHandlingOfficer || ''}
                  onChange={(e) => setFormData(p => ({ ...p, officeUseOnly: { ...p.officeUseOnly, fileHandlingOfficer: e.target.value } }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Date</label>
                <input
                  type="date"
                  value={formData.officeUseOnly?.date || ''}
                  onChange={(e) => setFormData(p => ({ ...p, officeUseOnly: { ...p.officeUseOnly, date: e.target.value } }))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Charges</label>
                <input
                  value={formData.officeUseOnly?.charges || ''}
                  onChange={(e) => setFormData(p => ({ ...p, officeUseOnly: { ...p.officeUseOnly, charges: e.target.value } }))}
                  placeholder="e.g. 1350000 + Ticket + Medical"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Save size={18} /> Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateForm;