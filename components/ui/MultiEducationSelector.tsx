import React, { useState } from 'react';
import { GraduationCap, X, ChevronDown } from 'lucide-react';

interface MultiEducationSelectorProps {
    selectedEducation: string[];
    onChange: (education: string[]) => void;
    label?: string;
    required?: boolean;
}

const EDUCATION_LEVELS = [
    'Grade 5 Scholarship',
    'O/L (Ordinary Level)',
    'A/L (Advanced Level)',
    'NVQ Level 1',
    'NVQ Level 2',
    'NVQ Level 3',
    'NVQ Level 4',
    'NVQ Level 5',
    'NVQ Level 6',
    'NVQ Level 7',
    'Certificate Course',
    'Diploma',
    'Higher Diploma',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'Doctorate (PhD)',
    'Professional Qualification',
    'Technical Training',
    'Vocational Training',
    'Other'
];

const MultiEducationSelector: React.FC<MultiEducationSelectorProps> = ({
    selectedEducation,
    onChange,
    label = 'Educational Qualifications',
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter available options (not already selected)
    const availableOptions = EDUCATION_LEVELS.filter(
        level => !selectedEducation.includes(level) &&
            level.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle selection
    const handleSelect = (level: string) => {
        if (!selectedEducation.includes(level)) {
            onChange([...selectedEducation, level]);
            setSearchTerm('');
            setIsOpen(false);
        }
    };

    // Handle removal
    const handleRemove = (level: string) => {
        onChange(selectedEducation.filter(l => l !== level));
    };

    // Get badge color based on education level
    const getBadgeColor = (level: string): string => {
        if (level.includes('NVQ')) return 'bg-purple-100 text-purple-700 border-purple-200';
        if (level.includes('Degree') || level.includes('Master') || level.includes('PhD')) {
            return 'bg-blue-100 text-blue-700 border-blue-200';
        }
        if (level.includes('Diploma')) return 'bg-green-100 text-green-700 border-green-200';
        if (level.includes('O/L') || level.includes('A/L')) return 'bg-orange-100 text-orange-700 border-orange-200';
        if (level.includes('Certificate') || level.includes('Training')) {
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="space-y-3">
            {/* Label */}
            <label className="block text-sm font-medium text-slate-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Selected Education Cards */}
            {selectedEducation.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedEducation.map((level) => (
                        <div
                            key={level}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getBadgeColor(level)} transition-all hover:shadow-sm`}
                        >
                            <GraduationCap size={14} />
                            <span className="text-sm font-medium">{level}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(level)}
                                className="hover:bg-white/50 rounded-full p-0.5 transition-colors"
                                title={`Remove ${level}`}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Dropdown Selector */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center justify-between text-left"
                >
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                        <GraduationCap size={18} className="text-slate-400" />
                        {selectedEducation.length === 0
                            ? 'Select educational qualifications'
                            : `${selectedEducation.length} qualification${selectedEducation.length !== 1 ? 's' : ''} selected`}
                    </span>
                    <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                            {/* Search Input */}
                            <div className="p-3 border-b border-slate-200">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search qualifications..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                />
                            </div>

                            {/* Options List */}
                            <div className="overflow-y-auto max-h-60">
                                {availableOptions.length > 0 ? (
                                    <div className="py-1">
                                        {availableOptions.map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => handleSelect(level)}
                                                className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm"
                                            >
                                                <GraduationCap size={16} className="text-slate-400" />
                                                <span className="text-slate-700">{level}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                                        {searchTerm
                                            ? `No qualifications found matching "${searchTerm}"`
                                            : 'All qualifications have been selected'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Helper Text */}
            {selectedEducation.length === 0 && required && (
                <p className="text-xs text-slate-500">
                    Select at least one educational qualification
                </p>
            )}
        </div>
    );
};

export default MultiEducationSelector;
