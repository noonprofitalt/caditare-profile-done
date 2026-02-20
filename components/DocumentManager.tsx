import React, { useState } from 'react';
import { Candidate, CandidateDocument, DocumentStatus, DocumentCategory, DocumentLog, DocumentType as DocType } from '../types';
import { NotificationService } from '../services/notificationService';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Clock, XCircle, Eye, Download, History, Lock, ShieldCheck, Maximize2 } from 'lucide-react';
import DocumentPreviewer from './ui/DocumentPreviewer';
import { DocumentService } from '../services/documentService';
interface DocumentManagerProps {
  candidate: Candidate;
  onUpdate: (updatedDocs: CandidateDocument[]) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ candidate, onUpdate }) => {
  const [selectedDoc, setSelectedDoc] = useState<CandidateDocument | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'upload' | 'verify' | 'history'>('list');
  const [dragActive, setDragActive] = useState(false);

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
    [DocType.MEDICAL_REPORT]: DocumentCategory.LATER_PROCESS,
    [DocType.POLICE_CLEARANCE]: DocumentCategory.LATER_PROCESS,
    [DocType.VISA_COPY]: DocumentCategory.LATER_PROCESS,
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

  // Stats - use full list to count properly
  const mandatoryDocs = fullDocumentList.filter(d => d.category === DocumentCategory.MANDATORY_REGISTRATION);
  const completedMandatory = mandatoryDocs.filter(d => d.status === DocumentStatus.APPROVED).length;
  const isWorkflowBlocked = completedMandatory < mandatoryDocs.length;

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
      user: 'Current User', // TODO: Use real user
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
      uploadedBy: 'Current User',
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
      user: 'Current User',
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
                accept=".pdf,.jpg,.png,.jpeg"
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
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" /> Document Verification Module
          </h3>
          <p className="text-sm text-slate-500">Secure storage • Audit Trail Enabled • Role-Based Access</p>
        </div>

        {isWorkflowBlocked && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            <Lock size={16} /> Workflow Blocked: Missing Mandatory Docs
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-200">
        <div className="p-4 text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Mandatory Docs</p>
          <p className="text-xl font-bold text-slate-800">{completedMandatory} / {mandatoryDocs.length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Pending Review</p>
          <p className="text-xl font-bold text-yellow-600">{candidate.documents?.filter(d => d.status === DocumentStatus.PENDING).length || 0}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Rejected / Fix</p>
          <p className="text-xl font-bold text-red-600">{candidate.documents?.filter(d => d.status === DocumentStatus.REJECTED || d.status === DocumentStatus.CORRECTION_REQUIRED).length || 0}</p>
        </div>
      </div>

      {/* Document List */}
      <div className="p-6">
        {[DocumentCategory.MANDATORY_REGISTRATION, DocumentCategory.LATER_PROCESS].map((category) => (
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

            <div className="mt-8">
              <h4 className="font-bold text-slate-800 mb-2 text-sm flex items-center gap-2"><History size={14} /> Audit Trail</h4>
              <div className="space-y-3">
                {selectedDoc.logs.map(log => (
                  <div key={log.id} className="text-xs border-l-2 border-slate-200 pl-3 py-1">
                    <p className="font-semibold text-slate-700">{log.action}</p>
                    <p className="text-slate-500">{log.user} • {log.timestamp}</p>
                    {log.details && <p className="text-slate-400 mt-1 italic">{log.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;
