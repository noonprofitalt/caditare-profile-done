import React from 'react';
import { Candidate, ProfileCompletionStatus, WorkflowStage } from '../types';
import { Phone, Mail, MapPin, Calendar, CheckCircle, AlertCircle, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CandidateHeroProps {
    candidate: Candidate;
}

const CandidateHero: React.FC<CandidateHeroProps> = ({ candidate }) => {
    // Get profile completion badge
    const getCompletionBadge = () => {
        switch (candidate.profileCompletionStatus) {
            case ProfileCompletionStatus.QUICK:
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-md">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Quick Form</span>
                    </div>
                );
            case ProfileCompletionStatus.PARTIAL:
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-md">
                        <TrendingUp size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{candidate.profileCompletionPercentage}% Complete</span>
                    </div>
                );
            case ProfileCompletionStatus.COMPLETE:
                return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-md">
                        <CheckCircle size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Profile Complete</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const getStageColor = () => {
        switch (candidate.stage) {
            case WorkflowStage.REGISTERED:
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case WorkflowStage.VERIFIED:
            case WorkflowStage.APPLIED:
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case WorkflowStage.OFFER_RECEIVED:
            case WorkflowStage.WP_RECEIVED:
            case WorkflowStage.EMBASSY_APPLIED:
                return 'bg-pink-100 text-pink-700 border-pink-200';
            case WorkflowStage.VISA_RECEIVED:
            case WorkflowStage.SLBFE_REGISTRATION:
            case WorkflowStage.TICKET_ISSUED:
                return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case WorkflowStage.DEPARTED:
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getDaysInStage = () => {
        if (!candidate.stageEnteredAt) return 0;
        const enteredDate = new Date(candidate.stageEnteredAt);
        if (isNaN(enteredDate.getTime())) return 0;

        const now = new Date();
        const diffMs = now.getTime() - enteredDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    return (
        <div className="bg-white border-b border-slate-200">
            <div className="px-6 py-6 max-w-7xl mx-auto">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-4">
                    <Link
                        to="/candidates"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Candidates
                    </Link>
                    <div className="flex items-center gap-2">
                        {getCompletionBadge()}
                        <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getStageColor()}`}>
                            {candidate.stage}
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&size=120&background=f1f5f9&color=334155`}
                            alt={candidate.name}
                            className="w-24 h-24 rounded-full border border-slate-200 shadow-sm object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-100 border-2 border-white rounded-full flex items-center justify-center">
                            <CheckCircle size={12} className="text-emerald-600" />
                        </div>
                    </div>

                    {/* Identity Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col mb-3">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{candidate.name}</h1>
                            <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                                <span className="text-blue-600 font-semibold">{candidate.role || 'No Role Assigned'}</span>
                                {candidate.nic && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <span>NIC: <span className="font-mono text-slate-600">{candidate.nic}</span></span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Contact Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                            {candidate.phone && (
                                <div className="flex items-center gap-1.5">
                                    <Phone size={14} className="text-slate-400" />
                                    {candidate.phone}
                                </div>
                            )}
                            {candidate.email && (
                                <div className="flex items-center gap-1.5">
                                    <Mail size={14} className="text-slate-400" />
                                    {candidate.email}
                                </div>
                            )}
                            {candidate.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-400" />
                                    {candidate.location}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Box */}
                    <div className="flex flex-row md:flex-col gap-4 bg-slate-50 rounded-lg border border-slate-200 p-4 min-w-[200px]">
                        <div className="flex justify-between items-center w-full">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Integrity Score</span>
                            <span className="text-sm font-bold text-blue-600">{candidate.profileCompletionPercentage}%</span>
                        </div>
                        <div className="flex justify-between items-center w-full">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documents</span>
                            <span className="text-sm font-bold text-slate-700">{candidate.documents?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center w-full">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time in Stage</span>
                            <span className="text-sm font-bold text-slate-700">{getDaysInStage()} Days</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateHero;
