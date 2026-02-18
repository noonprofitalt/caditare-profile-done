import React from 'react';
import { Candidate, ProfileCompletionStatus, WorkflowStage } from '../types';
import { Phone, Mail, MapPin, Calendar, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
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
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-300 rounded-lg backdrop-blur-sm">
                        <div className="w-2.5 h-2.5 bg-red-300 rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-white">QUICK FORM</span>
                    </div>
                );
            case ProfileCompletionStatus.PARTIAL:
                return (
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-300 rounded-lg backdrop-blur-sm">
                        <TrendingUp size={16} className="text-yellow-200" />
                        <span className="text-sm font-bold text-white">{candidate.profileCompletionPercentage}% COMPLETE</span>
                    </div>
                );
            case ProfileCompletionStatus.COMPLETE:
                return (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-300 rounded-lg backdrop-blur-sm">
                        <CheckCircle size={16} className="text-green-200" />
                        <span className="text-sm font-bold text-white">PROFILE COMPLETE</span>
                    </div>
                );
        }
    };

    const getStageColor = () => {
        switch (candidate.stage) {
            case WorkflowStage.REGISTERED:
                return 'bg-blue-400/30 text-blue-100 border-blue-300';
            case WorkflowStage.VERIFIED:
            case WorkflowStage.APPLIED:
                return 'bg-purple-400/30 text-purple-100 border-purple-300';
            case WorkflowStage.OFFER_RECEIVED:
            case WorkflowStage.WP_RECEIVED:
            case WorkflowStage.EMBASSY_APPLIED:
                return 'bg-pink-400/30 text-pink-100 border-pink-300';
            case WorkflowStage.VISA_RECEIVED:
            case WorkflowStage.SLBFE_REGISTRATION:
            case WorkflowStage.TICKET_ISSUED:
                return 'bg-indigo-400/30 text-indigo-100 border-indigo-300';
            case WorkflowStage.DEPARTED:
                return 'bg-green-400/30 text-green-100 border-green-300';
            default:
                return 'bg-slate-400/30 text-slate-100 border-slate-300';
        }
    };

    // Calculate days in current stage
    const getDaysInStage = () => {
        if (!candidate.stageEnteredAt) return 0;
        const enteredDate = new Date(candidate.stageEnteredAt);
        if (isNaN(enteredDate.getTime())) return 0;

        const now = new Date();
        const diffMs = now.getTime() - enteredDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    // Get primary action button
    const getPrimaryAction = () => {
        if (candidate.profileCompletionStatus !== ProfileCompletionStatus.COMPLETE) {
            return (
                <Link
                    to={`/applications/new?upgrade=${candidate.id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg"
                >
                    <AlertCircle size={20} />
                    Complete Profile
                </Link>
            );
        }

        return (
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg">
                <Calendar size={20} />
                Schedule
            </button>
        );
    };

    return (
        <div className="bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent"></div>
            <div className="px-4 md:px-8 py-4 relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0 group">
                        <img
                            src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&size=160`}
                            alt={candidate.name}
                            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-white/10 shadow-xl object-cover transition-premium group-hover:scale-105"
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                            <CheckCircle size={14} className="text-white" />
                        </div>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                        {/* Name & Badges */}
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase">{candidate.name}</h1>
                            {getCompletionBadge()}
                        </div>

                        {/* Role & Stage */}
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 mb-3">
                            <span className="text-sm md:text-base text-blue-300 font-semibold tracking-tight">{candidate.role || 'No Role Assigned'}</span>
                            <span className="hidden md:block text-slate-700 font-black">•</span>
                            <span className={`px-4 py-1.5 rounded-xl border text-[10px] md:text-xs font-black uppercase tracking-widest bg-white/5 backdrop-blur-md ${getStageColor()}`}>
                                {candidate.stage}
                            </span>
                            <span className="hidden md:block text-slate-700 font-black">•</span>
                            <span className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest">{getDaysInStage()} Days Active</span>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-6 text-[10px] mb-4">
                            {candidate.phone && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 transition-premium hover:bg-white/10 cursor-pointer">
                                    <Phone size={14} className="text-blue-400" />
                                    <span className="font-bold tracking-tighter">{candidate.phone}</span>
                                </div>
                            )}
                            {candidate.email && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 transition-premium hover:bg-white/10 cursor-pointer">
                                    <Mail size={14} className="text-blue-400" />
                                    <span className="font-bold tracking-tighter truncate max-w-[200px]">{candidate.email}</span>
                                </div>
                            )}
                            {candidate.location && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 transition-premium hover:bg-white/10 cursor-pointer">
                                    <MapPin size={14} className="text-blue-400" />
                                    <span className="font-bold tracking-tighter">{candidate.location}</span>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-3 border-t border-white/5">
                            <div>
                                <div className="text-lg font-bold tracking-tight text-blue-400">{candidate.profileCompletionPercentage}%</div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Integrity Score</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold tracking-tight">{candidate.documents?.length || 0}</div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Documents</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold tracking-tight">{candidate.timelineEvents?.length || 0}</div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Activity</div>
                            </div>
                            {candidate.experienceYears !== undefined && (
                                <div>
                                    <div className="text-lg font-bold tracking-tight text-emerald-400">{candidate.experienceYears}Y</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Years Exp.</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 w-full md:w-auto self-center">
                        <button className="flex items-center justify-center gap-2 px-6 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-bold text-xs shadow-md">
                            <Calendar size={16} />
                            Schedule
                        </button>
                        <Link
                            to={`/candidates`}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-premium font-bold text-[9px] uppercase tracking-widest border border-white/10 shadow-md"
                        >
                            Back to Candidates
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateHero;
