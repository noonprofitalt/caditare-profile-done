import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit2, MapPin, Video, Phone, HelpCircle } from 'lucide-react';
import { Candidate, InterviewRecord } from '../../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface InterviewWidgetProps {
    candidate: Candidate;
    onUpdate: (data: { interviews: InterviewRecord[] }) => void;
}

const InterviewWidget: React.FC<InterviewWidgetProps> = ({ candidate, onUpdate }) => {
    const interviews = candidate.stageData?.interviews || [];

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<InterviewRecord>>({
        date: '',
        time: '',
        method: 'In-Person',
        linkOrLocation: '',
        interviewer: '',
        status: 'Scheduled',
        notes: ''
    });

    const handleOpenForm = (interview?: InterviewRecord) => {
        if (interview) {
            setEditingId(interview.id);
            setFormData({ ...interview });
        } else {
            setEditingId(null);
            setFormData({
                date: '',
                time: '',
                method: 'In-Person',
                linkOrLocation: '',
                interviewer: '',
                status: 'Scheduled',
                notes: ''
            });
        }
        setIsFormOpen(true);
    };

    const handleSave = () => {
        if (!formData.date || !formData.time) return;

        let updatedInterviews = [...interviews];

        if (editingId) {
            updatedInterviews = updatedInterviews.map(inv =>
                inv.id === editingId ? { ...inv, ...formData } as InterviewRecord : inv
            );
        } else {
            updatedInterviews.push({
                ...formData,
                id: generateId(),
            } as InterviewRecord);
        }

        updatedInterviews.sort((a, b) => {
            const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00'}`);
            const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00'}`);
            return dateA.getTime() - dateB.getTime();
        });

        onUpdate({ interviews: updatedInterviews });
        setIsFormOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this interview schedule?')) {
            const updatedInterviews = interviews.filter(inv => inv.id !== id);
            onUpdate({ interviews: updatedInterviews });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'Passed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Failed': return 'bg-red-50 text-red-700 border-red-200';
            case 'Cancelled': return 'bg-slate-100 text-slate-600 border-slate-300';
            case 'No-Show': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'In-Person': return <MapPin size={12} />;
            case 'Online': return <Video size={12} />;
            case 'Phone': return <Phone size={12} />;
            default: return <HelpCircle size={12} />;
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <Calendar size={18} className="text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">Interviews</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {interviews.length} {interviews.length === 1 ? 'Schedule' : 'Schedules'}
                        </p>
                    </div>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => handleOpenForm()}
                        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                        <Plus size={14} /> New
                    </button>
                )}
            </div>

            <div className="p-5">
                {isFormOpen ? (
                    <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                            {editingId ? <Edit2 size={16} className="text-indigo-500" /> : <Plus size={16} className="text-indigo-500" />}
                            {editingId ? 'Edit Interview Schedule' : 'Schedule New Interview'}
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date *</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time *</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Method</label>
                                <select
                                    value={formData.method}
                                    onChange={e => setFormData({ ...formData, method: e.target.value as InterviewRecord['method'] })}
                                    className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="In-Person">In-Person</option>
                                    <option value="Online">Online / Video</option>
                                    <option value="Phone">Phone</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as InterviewRecord['status'] })}
                                    className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Passed">Passed</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="No-Show">No Show</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {formData.method === 'In-Person' ? 'Location' : formData.method === 'Online' ? 'Meeting Link' : 'Phone Number'}
                            </label>
                            <input
                                type="text"
                                value={formData.linkOrLocation}
                                onChange={e => setFormData({ ...formData, linkOrLocation: e.target.value })}
                                placeholder={formData.method === 'In-Person' ? 'Office branch, room no.' : formData.method === 'Online' ? 'https://meet.google.com/...' : '+94 77...'}
                                className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interviewer</label>
                            <input
                                type="text"
                                value={formData.interviewer}
                                onChange={e => setFormData({ ...formData, interviewer: e.target.value })}
                                placeholder="Name of interviewer"
                                className="w-full text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any specific requirements or notes..."
                                className="w-full text-sm border-slate-300 rounded-lg h-16 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-200">
                            <button
                                onClick={handleSave}
                                disabled={!formData.date || !formData.time}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingId ? 'Save Changes' : 'Schedule Interview'}
                            </button>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl border border-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {interviews.length > 0 ? (
                            interviews.map(interview => (
                                <div key={interview.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group overflow-hidden relative">
                                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${interview.status === 'Completed' || interview.status === 'Passed' ? 'bg-green-500' :
                                        interview.status === 'Scheduled' ? 'bg-indigo-500' :
                                            interview.status === 'Failed' || interview.status === 'No-Show' ? 'bg-red-500' : 'bg-slate-300'
                                        }`}></div>
                                    <div className="flex justify-between items-start mb-2.5 pl-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(interview.status)}`}>
                                                    {interview.status}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                                    {getMethodIcon(interview.method)}
                                                    {interview.method}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                <Calendar size={14} className="text-indigo-500" />
                                                {new Date(interview.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                <span className="text-slate-300">|</span>
                                                <Clock size={14} className="text-indigo-500" />
                                                {interview.time}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenForm(interview)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(interview.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pl-2">
                                        {(interview.interviewer || interview.linkOrLocation) && (
                                            <div className="flex flex-col gap-1 mt-2.5 pt-2.5 border-t border-slate-200/60">
                                                {interview.interviewer && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <span className="font-medium text-slate-400">With:</span>
                                                        <span className="font-semibold text-slate-700">{interview.interviewer}</span>
                                                    </div>
                                                )}
                                                {interview.linkOrLocation && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 line-clamp-1">
                                                        <span className="font-medium text-slate-400">Where:</span>
                                                        {interview.method === 'Online' ? (
                                                            <a href={interview.linkOrLocation.startsWith('http') ? interview.linkOrLocation : `https://${interview.linkOrLocation}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline bg-indigo-50 px-1 rounded truncate">
                                                                {interview.linkOrLocation}
                                                            </a>
                                                        ) : (
                                                            <span className="font-semibold text-slate-700">{interview.linkOrLocation}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {interview.notes && (
                                            <div className="mt-2.5 text-xs text-slate-500 bg-white border border-slate-100 p-2.5 rounded-lg italic shadow-sm relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-lg"></div>
                                                <span className="pl-2 block">{interview.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 shadow-sm">
                                    <Calendar size={20} className="text-indigo-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-600 mb-1">No Interviews Scheduled</p>
                                <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">Schedule an interview to track candidate screening and assessments.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewWidget;
