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
                        <span className="text-sm font-bold text-white">QUICK ADD</span>
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

    // Get stage badge color
    const getStageColor = () => {
        switch (candidate.stage) {
            case WorkflowStage.REGISTRATION:
                return 'bg-blue-400/30 text-blue-100 border-blue-300';
            case WorkflowStage.INTERVIEW:
                return 'bg-purple-400/30 text-purple-100 border-purple-300';
            case WorkflowStage.MEDICAL:
                return 'bg-pink-400/30 text-pink-100 border-pink-300';
            case WorkflowStage.TRAINING:
                return 'bg-indigo-400/30 text-indigo-100 border-indigo-300';
            case WorkflowStage.DEPLOYMENT:
                return 'bg-green-400/30 text-green-100 border-green-300';
            default:
                return 'bg-slate-400/30 text-slate-100 border-slate-300';
        }
    };

    // Calculate days in current stage
    const getDaysInStage = () => {
        const enteredDate = new Date(candidate.stageEnteredAt);
        const now = new Date();
        const diffMs = now.getTime() - enteredDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDays;
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
                Schedule Interview
            </button>
        );
    };

    return (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="px-8 py-8">
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&size=128`}
                            alt={candidate.name}
                            className="w-28 h-28 rounded-full border-4 border-white/30 shadow-xl object-cover"
                        />
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 border-4 border-blue-700 rounded-full" />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                        {/* Name & Badges */}
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-3xl font-bold truncate">{candidate.name}</h1>
                            {getCompletionBadge()}
                        </div>

                        {/* Role & Stage */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-lg text-blue-100">{candidate.role || 'No Role Assigned'}</span>
                            <span className="text-blue-300">•</span>
                            <span className={`px-3 py-1 rounded-lg border text-sm font-medium ${getStageColor()}`}>
                                {candidate.stage}
                            </span>
                            <span className="text-blue-300">•</span>
                            <span className="text-sm text-blue-200">{getDaysInStage()} days in stage</span>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-blue-100">
                            {candidate.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-blue-300" />
                                    <span>{candidate.phone}</span>
                                </div>
                            )}
                            {candidate.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-blue-300" />
                                    <span className="truncate max-w-xs">{candidate.email}</span>
                                </div>
                            )}
                            {candidate.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-blue-300" />
                                    <span>{candidate.location}</span>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
                            <div>
                                <div className="text-2xl font-bold">{candidate.profileCompletionPercentage}%</div>
                                <div className="text-xs text-blue-200">Profile Complete</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{candidate.documents?.length || 0}</div>
                                <div className="text-xs text-blue-200">Documents</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{candidate.timelineEvents?.length || 0}</div>
                                <div className="text-xs text-blue-200">Activities</div>
                            </div>
                            {candidate.experienceYears !== undefined && (
                                <div>
                                    <div className="text-2xl font-bold">{candidate.experienceYears}</div>
                                    <div className="text-xs text-blue-200">Years Experience</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        {getPrimaryAction()}
                        <Link
                            to={`/candidates`}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium border border-white/30"
                        >
                            Back to List
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateHero;
