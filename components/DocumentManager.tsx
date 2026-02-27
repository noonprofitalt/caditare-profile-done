import React, { useState } from 'react';
import { Candidate, CandidateDocument, DocumentStatus, DocumentCategory, DocumentLog, DocumentType as DocType } from '../types';
import { NotificationService } from '../services/notificationService';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Clock, XCircle, Eye, Download, History, Lock, ShieldCheck, Maximize2, Archive } from 'lucide-react';
import JSZip from 'jszip';
import DocumentPreviewer from './ui/DocumentPreviewer';
import { DocumentService } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
interface DocumentManagerProps {
  candidate: Candidate;
  onUpdate: (updatedDocs: CandidateDocument[]) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ candidate, onUpdate }) => {
  const { user } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<CandidateDocument | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'upload' | 'verify' | 'history'>('list');
  const [dragActive, setDragActive] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);

  // Document Type to Category Mapping
  const docTypeToCategory: Record<DocType, DocumentCategory> = {
    [DocType.PASSPORT]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.CV]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.PASSPORT_PHOTOS]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.FULL_PHOTO]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.EDU_OL]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.EDU_AL]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.EDU_LEARNING]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.EDU_PROFESSIONAL]: DocumentCategory.MANDATORY_REGISTRATION,
    // Medical & Security
    [DocType.MEDICAL_REPORT]: DocumentCategory.MEDICAL_SECURITY,
    [DocType.POLICE_CLEARANCE]: DocumentCategory.MEDICAL_SECURITY,
    [DocType.VACCINATION_RECORDS]: DocumentCategory.MEDICAL_SECURITY,
    // Additional certificates from paper form
    [DocType.BIRTH_CERTIFICATE]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.EXPERIENCE_LETTERS]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.NVQ_TRADE_TEST]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.COURSE_CERTIFICATES]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.WORKING_PHOTO]: DocumentCategory.SELECTION_WP,
    [DocType.SELF_INTRO_VIDEO_DOC]: DocumentCategory.SELECTION_WP,
    [DocType.WORKING_VIDEO_DOC]: DocumentCategory.SELECTION_WP,
    [DocType.FAMILY_BACKGROUND_REPORT]: DocumentCategory.MANDATORY_REGISTRATION,
    [DocType.POLICE_REPORT_LOCAL]: DocumentCategory.MEDICAL_SECURITY,
    [DocType.POLICE_REPORT_HQ]: DocumentCategory.MEDICAL_SECURITY,
    [DocType.ADVANCE_PAYMENT_RECEIPT]: DocumentCategory.LATER_PROCESS,
    // Selection & Work Permit
    [DocType.OFFER_LETTER]: DocumentCategory.SELECTION_WP,
    [DocType.SIGNED_OFFER_LETTER]: DocumentCategory.SELECTION_WP,
    [DocType.APPLICATION_CV]: DocumentCategory.SELECTION_WP,
    [DocType.IGI_RECORDS]: DocumentCategory.SELECTION_WP,
    [DocType.WORK_PERMIT]: DocumentCategory.SELECTION_WP,
    // Embassy & Visa
    [DocType.D_FORM]: DocumentCategory.EMBASSY_VISA,
    [DocType.EMBASSY_APPOINTMENT_LETTER]: DocumentCategory.EMBASSY_VISA,
    [DocType.USD_PAYMENT_RECEIPT]: DocumentCategory.EMBASSY_VISA,
    [DocType.TRAVEL_INSURANCE]: DocumentCategory.EMBASSY_VISA,
    [DocType.VISA_COPY]: DocumentCategory.LATER_PROCESS,
    // SLBFE & Departure
    [DocType.SLBFE_INSURANCE]: DocumentCategory.SLBFE_DEPARTURE,
    [DocType.BUREAU_DOCUMENTS_SET]: DocumentCategory.SLBFE_DEPARTURE,
    [DocType.FLIGHT_TICKET]: DocumentCategory.SLBFE_DEPARTURE,
    [DocType.AIR_TICKET]: DocumentCategory.LATER_PROCESS,
  };

  // Generate full document list with placeholders for missing ones
  const allDocTypes = Object.values(DocType);
  const fullDocumentList: CandidateDocument[] = allDocTypes.map(type => {
    const existing = candidate.documents?.find(d => d.type === type);
    if (existing) return existing;

    // Create a virtual missing document
    return {
      id: `virtual-${type}`,
      type: type as DocType,
      category: docTypeToCategory[type as DocType] || DocumentCategory.LATER_PROCESS,
      status: DocumentStatus.MISSING,
      version: 0,
      logs: []
    } as CandidateDocument;
  });

  // Stats
  const totalDocs = fullDocumentList.length;
  const approvedDocs = fullDocumentList.filter(d => d.status === DocumentStatus.APPROVED).length;
  const registrationDocs = fullDocumentList.filter(d => d.category === DocumentCategory.MANDATORY_REGISTRATION);
  const completedRegistration = registrationDocs.filter(d => d.status === DocumentStatus.APPROVED).length;
  const pendingDocs = fullDocumentList.filter(d => d.status === DocumentStatus.PENDING).length;
  const issueDocs = fullDocumentList.filter(d => d.status === DocumentStatus.REJECTED || d.status === DocumentStatus.CORRECTION_REQUIRED).length;
  const progressPercent = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, doc: CandidateDocument) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(doc.type, doc.category, e.dataTransfer.files[0]);
    }
  };

  const getDocTypeFromFileName = (filename: string): DocType | null => {
    const fn = filename.toLowerCase();

    if (fn.includes('passport') && !fn.includes('photo')) return DocType.PASSPORT;
    if (fn.includes('cv') || fn.includes('resume')) return DocType.CV;
    if (fn.includes('photo') && fn.includes('passport')) return DocType.PASSPORT_PHOTOS;
    if (fn.includes('photo')) return DocType.FULL_PHOTO;
    if (fn.includes('o/l') || fn.includes('ol cert')) return DocType.EDU_OL;
    if (fn.includes('a/l') || fn.includes('al cert')) return DocType.EDU_AL;
    if (fn.includes('medical')) return DocType.MEDICAL_REPORT;
    if (fn.includes('vaccin')) return DocType.VACCINATION_RECORDS;
    if (fn.includes('police')) return fn.includes('local') ? DocType.POLICE_REPORT_LOCAL : DocType.POLICE_CLEARANCE;
    if (fn.includes('visa')) return DocType.VISA_COPY;
    if (fn.includes('ticket')) return fn.includes('air') ? DocType.AIR_TICKET : DocType.FLIGHT_TICKET;
    if (fn.includes('offer')) return fn.includes('signed') ? DocType.SIGNED_OFFER_LETTER : DocType.OFFER_LETTER;
    if (fn.includes('work permit') || fn.includes('wp')) return DocType.WORK_PERMIT;
    if (fn.includes('birth')) return DocType.BIRTH_CERTIFICATE;
    if (fn.includes('experience')) return DocType.EXPERIENCE_LETTERS;
    if (fn.includes('nvq')) return DocType.NVQ_TRADE_TEST;
    if (fn.includes('course')) return DocType.COURSE_CERTIFICATES;
    if (fn.includes('family')) return DocType.FAMILY_BACKGROUND_REPORT;
    if (fn.includes('advance')) return DocType.ADVANCE_PAYMENT_RECEIPT;
    if (fn.includes('d-form') || fn.includes('d form')) return DocType.D_FORM;
    if (fn.includes('insurance')) return fn.includes('travel') ? DocType.TRAVEL_INSURANCE : DocType.SLBFE_INSURANCE;

    return null;
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingZip(true);
    NotificationService.addNotification({
      type: 'INFO',
      title: 'Extracting ZIP',
      message: 'Reading contents of the ZIP file...'
    });

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      const filesToUpload: { file: File; type: DocType; category: DocumentCategory; existingDoc?: CandidateDocument }[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
        if (zipEntry.dir) continue;
        const docType = getDocTypeFromFileName(zipEntry.name);
        if (!docType) continue;

        const category = docTypeToCategory[docType];
        const blob = await zipEntry.async("blob");

        const ext = zipEntry.name.split('.').pop() || 'tmp';
        const f = new File([blob], zipEntry.name, { type: blob.type || `application/${ext}` });

        filesToUpload.push({
          file: f,
          type: docType,
          category,
          existingDoc: candidate.documents?.find(d => d.type === docType)
        });
      }

      if (filesToUpload.length === 0) {
        NotificationService.addNotification({
          type: 'WARNING',
          title: 'No Matching Files',
          message: 'No files in the ZIP matched expected document types.'
        });
        setIsUploadingZip(false);
        return;
      }

      NotificationService.addNotification({
        type: 'INFO',
        title: 'Uploading Documents',
        message: `Starting upload of ${filesToUpload.length} recognized documents...`
      });

      const newAuthDocsList: CandidateDocument[] = [...(candidate.documents || [])];
      let uploadCount = 0;

      for (const item of filesToUpload) {
        const { path, url, error } = await DocumentService.uploadDocument(item.file, candidate.id, item.type);
        if (error) continue;

        const newLog: DocumentLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          action: 'UPLOAD',
          user: user?.name || 'System Admin',
          userId: user?.id,
          timestamp: new Date().toISOString(),
          details: `Bulk uploaded from ZIP v${(item.existingDoc?.version || 0) + 1} (${(item.file.size / 1024 / 1024).toFixed(2)} MB)`
        };

        const updatedDoc: CandidateDocument = {
          id: item.existingDoc?.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: item.type,
          category: item.category,
          status: DocumentStatus.PENDING,
          url, // Use the persistent public URL
          storagePath: path, // Store the storage path for future deletion
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.name || 'Internal Staff',
          uploadedById: user?.id,
          fileSize: `${(item.file.size / 1024 / 1024).toFixed(2)} MB`,
          fileType: item.file.type,
          version: (item.existingDoc?.version || 0) + 1,
          logs: [newLog, ...(item.existingDoc?.logs || [])],
          rejectionReason: undefined
        };

        const index = newAuthDocsList.findIndex(d => d.type === item.type);
        if (index !== -1) {
          newAuthDocsList[index] = updatedDoc;
        } else {
          newAuthDocsList.push(updatedDoc);
        }
        uploadCount++;
      }

      // Trigger parent update
      onUpdate(newAuthDocsList);

      NotificationService.addNotification({
        type: 'SUCCESS',
        title: 'Bulk Upload Complete',
        message: `Successfully uploaded ${uploadCount} documents from ZIP.`
      });

    } catch (err) {
      console.error('ZIP processing error', err);
      NotificationService.addNotification({
        type: 'WARNING',
        title: 'ZIP File Error',
        message: 'Failed to extract or read the ZIP file.'
      });
    } finally {
      setIsUploadingZip(false);
    }
  };

  const handleFileUpload = async (type: DocType, category: DocumentCategory, file: File) => {
    const existingDoc = candidate.documents?.find(d => d.type === type);

    // Upload to Supabase Storage
    const { path, url, error } = await DocumentService.uploadDocument(file, candidate.id, type);

    if (error) {
      alert(`Failed to upload document: ${error.message}`);
      return;
    }

    const newLog: DocumentLog = {
      id: `log-${Date.now()}`,
      action: 'UPLOAD',
      user: user?.name || 'System Admin',
      userId: user?.id,
      timestamp: new Date().toISOString(),
      details: `Uploaded v${(existingDoc?.version || 0) + 1} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    };

    const updatedDoc: CandidateDocument = {
      id: existingDoc?.id || `doc-${Date.now()}`,
      type,
      category,
      status: DocumentStatus.PENDING,
      url, // Use the persistent public URL
      storagePath: path, // Store the storage path for future deletion
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Internal Staff',
      uploadedById: user?.id,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      version: (existingDoc?.version || 0) + 1,
      logs: [newLog, ...(existingDoc?.logs || [])],
      rejectionReason: undefined
    };

    updateDocumentInList(updatedDoc);
    setViewMode('list');
    setSelectedDoc(null);
  };

  const handleVerification = (doc: CandidateDocument, status: DocumentStatus, reason?: string) => {
    const action: DocumentLog['action'] = status === DocumentStatus.APPROVED ? 'APPROVE' :
      status === DocumentStatus.REJECTED ? 'REJECT' : 'REQUEST_CORRECTION';

    const newLog: DocumentLog = {
      id: `log-${Date.now()}`,
      action,
      user: user?.name || 'System Admin',
      userId: user?.id,
      timestamp: new Date().toISOString(),
      details: reason ? `Reason: ${reason}` : undefined
    };

    const updatedDoc: CandidateDocument = {
      ...doc,
      status,
      rejectionReason: reason,
      logs: [newLog, ...(doc.logs || [])]
    };

    if (status === DocumentStatus.REJECTED || status === DocumentStatus.CORRECTION_REQUIRED) {
      NotificationService.addNotification({
        type: 'WARNING',
        title: `Document ${status === DocumentStatus.REJECTED ? 'Rejected' : 'Fix Required'}`,
        message: `${doc.type} for ${candidate.name} has been marked as ${status.toLowerCase().replace('_', ' ')}. ${reason ? `Reason: ${reason}` : ''}`,
        link: `/candidates/${candidate.id}?tab=documents`,
        candidateId: candidate.id
      });
    }

    updateDocumentInList(updatedDoc);
    setSelectedDoc(null);
  };

  const updateDocumentInList = (updatedDoc: CandidateDocument) => {
    const currentDocuments = candidate.documents || [];
    const index = currentDocuments.findIndex(d => d.id === updatedDoc.id || (d.id.startsWith('virtual-') && d.type === updatedDoc.type));

    let newDocs: CandidateDocument[];
    if (index !== -1) {
      newDocs = [...currentDocuments];
      newDocs[index] = updatedDoc;
    } else {
      newDocs = [...currentDocuments, updatedDoc];
    }

    onUpdate(newDocs);
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED: return 'text-green-600 bg-green-50 border-green-200';
      case DocumentStatus.REJECTED: return 'text-red-600 bg-red-50 border-red-200';
      case DocumentStatus.PENDING: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case DocumentStatus.CORRECTION_REQUIRED: return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-slate-400 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED: return <CheckCircle size={16} />;
      case DocumentStatus.REJECTED: return <XCircle size={16} />;
      case DocumentStatus.PENDING: return <Clock size={16} />;
      case DocumentStatus.CORRECTION_REQUIRED: return <AlertCircle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const renderUploadModal = () => {
    if (!selectedDoc) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Upload {selectedDoc.type}</h3>
            <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
          </div>
          <div className="p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, selectedDoc)}
            >
              <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 font-medium">Drag and drop your file here</p>
              <p className="text-sm text-slate-400 mt-2">or</p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(selectedDoc.type, selectedDoc.category, e.target.files[0])}
                accept=".pdf,.jpg,.png,.jpeg,.zip,application/zip,application/x-zip-compressed"
              />
              <label htmlFor="file-upload" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 font-medium">
                Browse Files
              </label>
            </div>
            <div className="mt-6 text-xs text-slate-500 flex items-center gap-2 justify-center">
              <ShieldCheck size={14} className="text-green-600" />
              Files are encrypted and securely stored. Max 5MB. PDF, JPG, PNG.
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVerifyModal = () => {
    if (!selectedDoc) return null;
    return (
      <VerifyModal
        selectedDoc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onVerify={handleVerification}
      />
    );
  };

  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; fileType?: string } | null>(null);

  const renderPreviewer = () => {
    if (!previewDoc) return null;
    return (
      <DocumentPreviewer
        url={previewDoc.url}
        title={previewDoc.title}
        fileType={previewDoc.fileType}
        onClose={() => setPreviewDoc(null)}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" /> Document Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Secure storage • Audit Trail • Role-Based Access</p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <input
                type="file"
                id="bulk-zip-upload"
                className="hidden"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleZipUpload}
                disabled={isUploadingZip}
              />
              <label
                htmlFor="bulk-zip-upload"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-premium cursor-pointer ${isUploadingZip
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                  }`}
              >
                {isUploadingZip ? (
                  <Clock size={14} className="animate-spin text-blue-500" />
                ) : (
                  <Archive size={14} className="text-blue-600" />
                )}
                {isUploadingZip ? 'Extracting ZIP...' : 'Bulk ZIP Upload'}
              </label>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Overall Progress</p>
              <p className="text-lg font-bold text-slate-800">{approvedDocs}<span className="text-slate-400 font-normal">/{totalDocs}</span></p>
            </div>
            <div className="w-24 h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressPercent >= 80 ? 'bg-green-500' :
                  progressPercent >= 40 ? 'bg-blue-500' :
                    'bg-amber-500'
                  }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${progressPercent >= 80 ? 'bg-green-50 text-green-700' :
              progressPercent >= 40 ? 'bg-blue-50 text-blue-700' :
                'bg-amber-50 text-amber-700'
              }`}>{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-200">
        <div className="p-3.5 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Registration</p>
          <p className={`text-lg font-bold ${completedRegistration === registrationDocs.length ? 'text-green-600' : 'text-slate-800'}`}>
            {completedRegistration}<span className="text-slate-400 font-normal text-sm">/{registrationDocs.length}</span>
          </p>
        </div>
        <div className="p-3.5 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Approved</p>
          <p className="text-lg font-bold text-green-600">{approvedDocs}</p>
        </div>
        <div className="p-3.5 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pending</p>
          <p className={`text-lg font-bold ${pendingDocs > 0 ? 'text-yellow-600' : 'text-slate-300'}`}>{pendingDocs}</p>
        </div>
        <div className="p-3.5 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Issues</p>
          <p className={`text-lg font-bold ${issueDocs > 0 ? 'text-red-600' : 'text-slate-300'}`}>{issueDocs}</p>
        </div>
      </div>

      {/* Document List */}
      <div className="p-6">
        {[DocumentCategory.MANDATORY_REGISTRATION, DocumentCategory.MEDICAL_SECURITY, DocumentCategory.SELECTION_WP, DocumentCategory.EMBASSY_VISA, DocumentCategory.SLBFE_DEPARTURE, DocumentCategory.LATER_PROCESS].map((category) => (
          <div key={category} className="mb-8 last:mb-0">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              {category}
              {category === DocumentCategory.MANDATORY_REGISTRATION && <span className="text-red-500">*</span>}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fullDocumentList.filter(d => d.category === category).map((doc) => (
                <div key={doc.id} className={`group relative flex items-start p-4 rounded-xl border transition-all ${getStatusColor(doc.status)} bg-opacity-30`}>
                  <div className={`p-2 rounded-lg mr-4 ${doc.status === DocumentStatus.MISSING ? 'bg-slate-200 text-slate-500' : 'bg-white shadow-sm'}`}>
                    {getStatusIcon(doc.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-semibold text-slate-800 truncate" title={doc.type}>{doc.type}</h5>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>

                    {doc.status === DocumentStatus.MISSING ? (
                      <button
                        onClick={() => { setSelectedDoc(doc); setViewMode('upload'); }}
                        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <UploadCloud size={12} /> Upload Required
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 truncate">
                          {doc.fileSize} • {doc.uploadedAt}
                        </p>
                        {doc.rejectionReason && (
                          <p className="text-xs text-red-600 font-medium bg-red-50 p-1 rounded">Reason: {doc.rejectionReason}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => setPreviewDoc({ url: doc.url!, title: doc.type, fileType: doc.fileType })} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Maximize2 size={12} /> Preview
                          </button>
                          <button onClick={() => { setSelectedDoc(doc); setViewMode('verify'); }} className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1">
                            <Eye size={12} /> Verify
                          </button>
                          <button onClick={() => { setSelectedDoc(doc); setViewMode('upload'); }} className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1">
                            <UploadCloud size={12} /> New Version
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {viewMode === 'upload' && renderUploadModal()}
      {viewMode === 'verify' && renderVerifyModal()}
      {renderPreviewer()}
    </div>
  );
};

interface VerifyModalProps {
  selectedDoc: CandidateDocument;
  onClose: () => void;
  onVerify: (doc: CandidateDocument, status: DocumentStatus, reason?: string) => void;
}

const VerifyModal: React.FC<VerifyModalProps> = ({ selectedDoc, onClose, onVerify }) => {
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Verify: {selectedDoc.type}</h3>
            <p className="text-xs text-slate-500">Version {selectedDoc.version} • Uploaded by {selectedDoc.uploadedBy} on {selectedDoc.uploadedAt}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-slate-100 flex items-center justify-center p-8 overflow-auto">
            {selectedDoc.url ? (
              <div className="w-full h-full flex items-center justify-center">
                {(selectedDoc.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || selectedDoc.fileType?.startsWith('image/')) ? (
                  <img
                    src={selectedDoc.url}
                    alt={selectedDoc.type}
                    className="max-w-full max-h-full object-contain shadow-2xl rounded border border-slate-200"
                  />
                ) : (
                  <iframe
                    src={selectedDoc.url}
                    title={selectedDoc.type}
                    className="w-full h-full bg-white rounded shadow-2xl border border-slate-200"
                  />
                )}
              </div>
            ) : (
              <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full text-center aspect-[3/4] flex flex-col items-center justify-center">
                <FileText size={64} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Digital Version Not Available</p>
                <p className="text-slate-400 text-xs mt-2 max-w-[200px]">This document has been logged but the physical file hasn't been uploaded yet.</p>
                <p className="font-mono text-[10px] text-slate-300 mt-4 uppercase tracking-wider">{selectedDoc.type}_v{selectedDoc.version}</p>
              </div>
            )}
          </div>

          {/* Actions Panel */}
          <div className="w-80 border-l border-slate-200 p-6 overflow-y-auto bg-white">
            <h4 className="font-bold text-slate-800 mb-4">Verification Actions</h4>

            <div className="space-y-3">
              <button
                onClick={() => onVerify(selectedDoc, DocumentStatus.APPROVED)}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Approve Document
              </button>

              <hr className="border-slate-100 my-4" />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Rejection / Correction Reason</label>
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  rows={3}
                  placeholder="Why is this rejected?"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                ></textarea>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onVerify(selectedDoc, DocumentStatus.CORRECTION_REQUIRED, rejectReason)}
                    disabled={!rejectReason}
                    className="px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-medium hover:bg-orange-100 disabled:opacity-50"
                  >
                    Request Fix
                  </button>
                  <button
                    onClick={() => onVerify(selectedDoc, DocumentStatus.REJECTED, rejectReason)}
                    disabled={!rejectReason}
                    className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                <History size={16} className="text-blue-600" /> Document Audit Trail
              </h4>
              <div className="space-y-4">
                {selectedDoc.logs.map((log, index, arr) => {
                  const date = new Date(log.timestamp);
                  const formattedDate = !isNaN(date.getTime())
                    ? date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : log.timestamp;
                  const isLast = index === arr.length - 1;
                  return (
                    <div key={log.id} className="relative pl-4">
                      <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50 z-10"></div>
                      {!isLast && <div className="absolute left-[3px] top-4 bottom-[-24px] w-[2px] bg-slate-200"></div>}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm ml-2">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-slate-800 text-xs">{log.action}</p>
                          <span className="text-[10px] font-medium text-slate-400">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-600">{log.user?.charAt(0).toUpperCase() || '?'}</span>
                          </div>
                          <span title={log.userId ? `User ID: ${log.userId}` : 'System User'} className="text-[11px] font-medium text-slate-600 cursor-help hover:text-blue-600 transition-colors">
                            {log.user}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic leading-relaxed">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;
