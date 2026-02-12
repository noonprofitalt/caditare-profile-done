import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface MultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    label?: string;
    searchPlaceholder?: string;
    className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    selected,
    onChange,
    placeholder = 'Select items...',
    label,
    searchPlaceholder = 'Search...',
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search query
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const removeItem = (item: string) => {
        onChange(selected.filter(i => i !== item));
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    {label}
                </label>
            )}

            {/* Selected Items as Cards */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selected.map(item => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors group"
                        >
                            {item}
                            <button
                                type="button"
                                onClick={() => removeItem(item)}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                aria-label={`Remove ${item}`}
                            >
                                <X size={14} className="text-blue-600" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Dropdown Trigger */}
            <div ref={dropdownRef} className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-left flex items-center justify-between hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                    <span className={selected.length === 0 ? 'text-slate-400' : 'text-slate-700'}>
                        {selected.length === 0
                            ? placeholder
                            : `${selected.length} selected`}
                    </span>
                    <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {/* Search Box */}
                        <div className="p-3 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-64 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                    No options found
                                </div>
                            ) : (
                                filteredOptions.map(option => (
                                    <label
                                        key={option}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors group"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(option)}
                                            onChange={() => toggleOption(option)}
                                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium">
                                            {option}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {selected.length > 0 && (
                            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">
                                    {selected.length} item{selected.length !== 1 ? 's' : ''} selected
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onChange([])}
                                    className="text-xs text-red-600 hover:text-red-700 font-bold"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiSelect;
