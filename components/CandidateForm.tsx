import React, { useState, useEffect } from 'react';
import { Candidate, StageData, DocumentType, DocumentStatus, PaymentRecord } from '../types';
import { X, Save, User, MapPin, Briefcase, Mail, Phone, Globe, Award, Activity, Calendar, FileText, CreditCard, Plus, Trash2 } from 'lucide-react';

interface CandidateFormProps {
  initialData?: Partial<Candidate>;
  onSubmit: (data: any) => void;
  onClose: () => void;
  title: string;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ initialData, onSubmit, onClose, title }) => {
  // Safe defaults for controlled inputs
  const splitName = initialData?.name ? initialData.name.split(' ') : ['', ''];
  const defaultFirstName = initialData?.firstName || splitName[0];
  const defaultLastName = initialData?.lastName || splitName.slice(1).join(' ');

  // Document Status Defaults
  const passportPhotosDoc = initialData?.documents?.find(d => d.type === DocumentType.PASSPORT_PHOTOS);
  const fullPhotoDoc = initialData?.documents?.find(d => d.type === DocumentType.FULL_PHOTO);

  // Form State
  const [formData, setFormData] = useState({
    firstName: defaultFirstName,
    lastName: defaultLastName,
    nic: initialData?.nic || '',
    dob: initialData?.dob || '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    whatsapp: initialData?.whatsapp || initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    education: initialData?.education || '',

    // Professional & Operational (Preserved)
    role: initialData?.role || '',
    location: initialData?.location || '', // Will sync with City
    experienceYears: initialData?.experienceYears || 0,
    skills: initialData?.skills?.join(', ') || '',
    preferredCountries: initialData?.preferredCountries?.join(', ') || '',
    
    // Stage Data
    employerStatus: initialData?.stageData?.employerStatus || 'Pending',
    medicalStatus: initialData?.stageData?.medicalStatus || 'Pending',
    policeStatus: initialData?.stageData?.policeStatus || 'Pending',
    visaStatus: initialData?.stageData?.visaStatus || 'Pending',
    paymentStatus: initialData?.stageData?.paymentStatus || 'Pending',
    paymentNotes: initialData?.stageData?.paymentNotes || '',

    // Photo Docs Status
    passportPhotosStatus: passportPhotosDoc?.status || DocumentStatus.MISSING,
    fullPhotoStatus: fullPhotoDoc?.status || DocumentStatus.MISSING,
  });

  // Payment History State
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(initialData?.stageData?.paymentHistory || []);
  const [newPayment, setNewPayment] = useState({ date: '', amount: '', notes: '' });

  const [age, setAge] = useState<string>('Auto-calculated');

  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge.toString());
    } else {
      setAge('Auto-calculated');
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const stageDataUpdate: StageData = {
        ...initialData?.stageData,
        employerStatus: formData.employerStatus as any,
        medicalStatus: formData.medicalStatus as any,
        policeStatus: formData.policeStatus as any,
        visaStatus: formData.visaStatus as any,
        paymentStatus: formData.paymentStatus as any,
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

    const processedData = {
      ...formData,
      // Reconstruct main name and location for compatibility
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      location: formData.city ? `${formData.city}, ${formData.address}` : formData.address,
      
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      preferredCountries: formData.preferredCountries.split(',').map(s => s.trim()).filter(s => s),
      stageData: stageDataUpdate,
      documents: updatedDocuments, // Pass updated docs back
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">First Name <span className="text-red-500">*</span></label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Last Name <span className="text-red-500">*</span></label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
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
                  onChange={handleChange}
                  required
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
                    required
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
                  onChange={handleChange}
                  required
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
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">WhatsApp Number <span className="text-red-500">*</span></label>
                <input
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  required
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
                required
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
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Row 8: Education */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Highest Education Level <span className="text-red-500">*</span></label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select level</option>
                <option value="G.C.E O/L">G.C.E O/L</option>
                <option value="G.C.E A/L">G.C.E A/L</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Other">Other</option>
              </select>
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
                        required
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
             <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Preferred Countries</label>
                <input
                    name="preferredCountries"
                    value={formData.preferredCountries}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
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
                                onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Amount</label>
                            <input 
                                type="text"
                                placeholder="0.00"
                                value={newPayment.amount}
                                onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-5">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                            <input 
                                type="text"
                                placeholder="e.g. Initial deposit"
                                value={newPayment.notes}
                                onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
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