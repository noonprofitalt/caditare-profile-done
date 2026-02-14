import React, { useState } from 'react';
import { Candidate, ProfileCompletionStatus, WorkflowStage, MedicalStatus } from '../types';
import { Phone, Mail, MapPin, Calendar, ChevronDown, ChevronUp, FileText, CheckCircle, AlertCircle, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileCompletionService } from '../services/profileCompletionService';

import WorkflowEngine from '../services/workflowEngine.v2';
import { ReportService } from '../services/reportService';

interface CandidateCardProps {
    candidate: Candidate;
    onSelect?: (id: string) => void;
    isSelected?: boolean;
    showAudit?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onSelect, isSelected, showAudit }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Get profile completion badge
    const getCompletionBadge = () => {
        switch (candidate.profileCompletionStatus) {
            case ProfileCompletionStatus.QUICK:
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-red-700">QUICK ADD</span>
                    </div>
                );
            case ProfileCompletionStatus.PARTIAL:
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                        <span className="text-xs font-bold text-yellow-700">{candidate.profileCompletionPercentage}%</span>
                    </div>
                );
            case ProfileCompletionStatus.COMPLETE:
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-xs font-bold text-green-700">COMPLETE</span>
                    </div>
                );
        }
    };

    // Get stage color
    const getStageColor = () => {
        switch (candidate.stage) {
            case WorkflowStage.REGISTERED:
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case WorkflowStage.VERIFIED:
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case WorkflowStage.APPLIED:
                return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case WorkflowStage.VISA_RECEIVED:
                return 'bg-green-100 text-green-700 border-green-200';
            case WorkflowStage.DEPARTED:
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    // Get quick actions based on profile status
    const getQuickActions = () => {
        if (candidate.profileCompletionStatus !== ProfileCompletionStatus.COMPLETE) {
            return (
                <Link
                    to={`/applications/new?upgrade=${candidate.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                    <FileText size={16} />
                    Complete Profile
                </Link>
            );
        }

        return (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                <Calendar size={16} />
                Schedule Interview
            </button>
        );
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const sla = WorkflowEngine.calculateSLAStatus(candidate);
    const nextStage = WorkflowEngine.getNextStage(candidate.stage);
    const validation = nextStage ? WorkflowEngine.validateTransition(candidate, nextStage) : null;
    const hasBlockers = !!(validation && !validation.allowed);

    return (
        <div className={`bg-white border rounded-xl p-5 transition-all duration-200 ${isExpanded ? 'border-blue-400 shadow-lg' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
            } ${showAudit && (sla.status === 'OVERDUE' || hasBlockers) ? 'bg-red-50/50 border-red-200 ring-2 ring-red-500/20' : ''
            } ${showAudit && sla.status === 'WARNING' && !hasBlockers ? 'bg-orange-50/50 border-orange-200' : ''}`}>

            {/* Integrity Audit Banner */}
            {showAudit && (
                <div className={`-mt-5 -mx-5 px-5 py-2 mb-4 rounded-t-xl border-b flex items-center justify-between ${sla.status === 'OVERDUE' || hasBlockers
                    ? 'bg-red-600 text-white border-red-700'
                    : sla.status === 'WARNING'
                        ? 'bg-orange-500 text-white border-orange-600'
                        : 'bg-emerald-600 text-white border-emerald-700'
                    }`}>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {sla.status === 'OVERDUE' || hasBlockers ? 'CRITICAL INTEGRITY BREACH' : sla.status === 'WARNING' ? 'SLA WARNING' : 'INTEGRITY PASSED'}
                        </span>
                    </div>
                    <div className="text-[10px] font-medium">
                        {sla.status === 'OVERDUE' && `SLA Breach: ${sla.daysElapsed} days `}
                        {hasBlockers && `| Missing Critical Items `}
                        {sla.status === 'ON_TIME' && !hasBlockers && 'All documents & timelines on track'}
                    </div>
                </div>
            )}
            {/* Main Card Content */}
            <div className="flex items-start gap-4">
                {/* Checkbox */}
                {onSelect && (
                    <div className="pt-1">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect(candidate.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <img
                        src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`}
                        alt={candidate.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Link
                                    to={`/candidates/${candidate.id}`}
                                    className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors truncate"
                                >
                                    {candidate.name}
                                </Link>
                                {getCompletionBadge()}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="font-medium">{candidate.role || 'No Role'}</span>
                                <span className="text-slate-400">•</span>
                                <span className={`px-2 py-0.5 rounded border text-xs font-medium ${getStageColor()}`}>
                                    {candidate.stage}
                                </span>
                                {candidate.profileCompletionStatus !== ProfileCompletionStatus.COMPLETE && (
                                    <>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-500">{candidate.profileCompletionPercentage}% Complete</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Expand Button */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {isExpanded ? <ChevronUp size={20} className="text-slate-600" /> : <ChevronDown size={20} className="text-slate-600" />}
                        </button>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-slate-600">
                        {candidate.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone size={14} className="text-slate-400" />
                                <span>{candidate.phone}</span>
                            </div>
                        )}
                        {candidate.email && (
                            <div className="flex items-center gap-1.5">
                                <Mail size={14} className="text-slate-400" />
                                <span className="truncate max-w-[200px]">{candidate.email}</span>
                            </div>
                        )}
                        {candidate.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-slate-400" />
                                <span>{candidate.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3">
                        {getQuickActions()}
                        <Link
                            to={`/candidates/${candidate.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                        >
                            View Details
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                        <Clock size={12} />
                        <span>Registered {formatDate(candidate.stageEnteredAt)}</span>
                        {candidate.timelineEvents && candidate.timelineEvents.length > 0 && (
                            <>
                                <span>•</span>
                                <span>Last updated {formatDate(candidate.timelineEvents[candidate.timelineEvents.length - 1].timestamp)}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                    {/* Missing Fields (for incomplete profiles) */}
                    {candidate.profileCompletionStatus !== ProfileCompletionStatus.COMPLETE && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={16} className="text-yellow-600" />
                                <h4 className="font-semibold text-sm text-yellow-900">Missing Information</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {ProfileCompletionService.getMissingFields(candidate).slice(0, 10).map((field, idx) => (
                                    <span key={`missing-${field}-${idx}`} className="px-2 py-1 bg-white border border-yellow-300 rounded text-xs text-yellow-800">
                                        {field}
                                    </span>
                                ))}
                                {ProfileCompletionService.getMissingFields(candidate).length > 10 && (
                                    <span className="px-2 py-1 text-xs text-yellow-700 font-medium">
                                        +{ProfileCompletionService.getMissingFields(candidate).length - 10} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Compliance Status */}
                    <div>
                        <h4 className="font-semibold text-sm text-slate-700 mb-2">Compliance & Documents</h4>

                        {/* Active Flags Warning */}
                        {candidate.complianceFlags?.some(f => !f.isResolved) && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <h5 className="flex items-center gap-2 text-xs font-bold text-red-800 uppercase tracking-wide mb-2">
                                    <AlertTriangle size={14} /> Active Compliance Flags
                                </h5>
                                <div className="space-y-1">
                                    {candidate.complianceFlags.filter(f => !f.isResolved).map(flag => (
                                        <div key={flag.id} className="flex items-start gap-2 text-sm text-red-700">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${flag.severity === 'CRITICAL' ? 'bg-red-200 text-red-900' : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {flag.severity}
                                            </span>
                                            <span>{flag.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${candidate.passportData?.status === 'VALID' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm text-slate-600">Passport</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${candidate.pccData?.status === 'VALID' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm text-slate-600">PCC</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${candidate.stageData?.medicalStatus === MedicalStatus.COMPLETED ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className="text-sm text-slate-600">Medical</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    {candidate.timelineEvents && candidate.timelineEvents.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">Recent Activity</h4>
                            <div className="space-y-2">
                                {candidate.timelineEvents.slice(-3).reverse().map((event, idx) => (
                                    <div key={event.id || `event-${idx}`} className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                                        <div className="flex-1">
                                            <div className="text-slate-900 font-medium">{event.title}</div>
                                            <div className="text-slate-500 text-xs">{formatDate(event.timestamp)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CandidateCard;
