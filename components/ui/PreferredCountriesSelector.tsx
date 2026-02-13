import React, { useState } from 'react';
import { Globe, X, ChevronDown, MapPin } from 'lucide-react';

interface PreferredCountriesSelectorProps {
    selectedCountries: string[];
    onChange: (countries: string[]) => void;
    onCountryTemplateApplied?: (country: string) => void;
    label?: string;
    required?: boolean;
    maxSelection?: number;
    allowedRegions?: string[]; // New: Filter by specific regions (e.g., ['Europe'])
}

// Grouped by region for better UX
const COUNTRIES_BY_REGION = {
    'Middle East (GCC)': [
        { name: 'Saudi Arabia', flag: '🇸🇦', popular: true },
        { name: 'United Arab Emirates', flag: '🇦🇪', popular: true },
        { name: 'Qatar', flag: '🇶🇦', popular: true },
        { name: 'Kuwait', flag: '🇰🇼', popular: true },
        { name: 'Oman', flag: '🇴🇲', popular: true },
        { name: 'Bahrain', flag: '🇧🇭', popular: true }
    ],
    'Asia Pacific': [
        { name: 'Singapore', flag: '🇸🇬', popular: true },
        { name: 'Malaysia', flag: '🇲🇾', popular: true },
        { name: 'Hong Kong', flag: '🇭🇰', popular: false },
        { name: 'Japan', flag: '🇯🇵', popular: false },
        { name: 'South Korea', flag: '🇰🇷', popular: false },
        { name: 'Maldives', flag: '🇲🇻', popular: false }
    ],
    'Europe': [
        { name: 'Romania', flag: '🇷🇴', popular: true },
        { name: 'Poland', flag: '🇵🇱', popular: true },
        { name: 'Italy', flag: '🇮🇹', popular: false },
        { name: 'Cyprus', flag: '🇨🇾', popular: false },
        { name: 'Greece', flag: '🇬🇷', popular: false }
    ],
    'Other': [
        { name: 'Israel', flag: '🇮🇱', popular: false },
        { name: 'Lebanon', flag: '🇱🇧', popular: false },
        { name: 'Jordan', flag: '🇯🇴', popular: false }
    ]
};

const PreferredCountriesSelector: React.FC<PreferredCountriesSelectorProps> = ({
    selectedCountries,
    onChange,
    onCountryTemplateApplied,
    label = 'Preferred Countries',
    required = false,
    maxSelection,
    allowedRegions
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Flatten all countries for search
    const allCountries = Object.values(COUNTRIES_BY_REGION).flat();

    // Filter countries based on search AND allowed regions
    const filteredRegions = Object.entries(COUNTRIES_BY_REGION).reduce((acc, [region, countries]) => {
        // Skip if region not allowed
        if (allowedRegions && !allowedRegions.includes(region)) return acc;

        const filtered = countries.filter(
            country =>
                !selectedCountries.includes(country.name) &&
                country.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[region] = filtered;
        }
        return acc;
    }, {} as Record<string, typeof allCountries>);

    // Handle selection
    const handleSelect = (countryName: string) => {
        if (maxSelection && selectedCountries.length >= maxSelection) {
            alert(`You can select a maximum of ${maxSelection} countries`);
            return;
        }

        if (!selectedCountries.includes(countryName)) {
            onChange([...selectedCountries, countryName]);

            // Apply country-specific document template
            if (onCountryTemplateApplied) {
                onCountryTemplateApplied(countryName);
            }

            setSearchTerm('');
            setIsOpen(false);
        }
    };

    // Handle removal
    const handleRemove = (countryName: string) => {
        onChange(selectedCountries.filter(c => c !== countryName));
    };

    // Get country data
    const getCountryData = (name: string) => {
        return allCountries.find(c => c.name === name) || { name, flag: '🌍', popular: false };
    };

    // Get badge color based on region
    const getBadgeColor = (countryName: string): string => {
        for (const [region, countries] of Object.entries(COUNTRIES_BY_REGION)) {
            if (countries.some(c => c.name === countryName)) {
                if (region === 'Middle East (GCC)') return 'bg-amber-100 text-amber-700 border-amber-200';
                if (region === 'Asia Pacific') return 'bg-blue-100 text-blue-700 border-blue-200';
                if (region === 'Europe') return 'bg-purple-100 text-purple-700 border-purple-200';
                return 'bg-slate-100 text-slate-700 border-slate-200';
            }
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="space-y-3">
            {/* Label */}
            <label className="block text-sm font-medium text-slate-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
                {maxSelection && (
                    <span className="ml-2 text-xs text-slate-500">
                        (Max {maxSelection})
                    </span>
                )}
            </label>

            {/* Selected Countries Cards */}
            {selectedCountries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedCountries.map((countryName) => {
                        // Check if country belongs to allowed regions (if restricted)
                        if (allowedRegions) {
                            const countryRegion = Object.keys(COUNTRIES_BY_REGION).find(region =>
                                COUNTRIES_BY_REGION[region as keyof typeof COUNTRIES_BY_REGION].some(c => c.name === countryName)
                            );
                            if (!countryRegion || !allowedRegions.includes(countryRegion)) {
                                return null;
                            }
                        }

                        const country = getCountryData(countryName);
                        return (
                            <div
                                key={countryName}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getBadgeColor(countryName)} transition-all hover:shadow-sm`}
                            >
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm font-medium">{countryName}</span>
                                {country.popular && (
                                    <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded">Popular</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemove(countryName)}
                                    className="hover:bg-white/50 rounded-full p-0.5 transition-colors"
                                    title={`Remove ${countryName}`}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
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
                        <Globe size={18} className="text-slate-400" />
                        {selectedCountries.length === 0
                            ? 'Select preferred countries'
                            : `${selectedCountries.length} countr${selectedCountries.length !== 1 ? 'ies' : 'y'} selected`}
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
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
                            {/* Search Input */}
                            <div className="p-3 border-b border-slate-200">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search countries..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                />
                            </div>

                            {/* Countries List (Grouped by Region) */}
                            <div className="overflow-y-auto max-h-80">
                                {Object.keys(filteredRegions).length > 0 ? (
                                    <div className="py-1">
                                        {Object.entries(filteredRegions).map(([region, countries]) => (
                                            <div key={region}>
                                                {/* Region Header */}
                                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-slate-400" />
                                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                                            {region}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Countries in Region */}
                                                {countries.map((country) => (
                                                    <button
                                                        key={country.name}
                                                        type="button"
                                                        onClick={() => handleSelect(country.name)}
                                                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 text-sm"
                                                    >
                                                        <span className="text-xl">{country.flag}</span>
                                                        <span className="flex-1 text-slate-700">{country.name}</span>
                                                        {country.popular && (
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                                Popular
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                                        {searchTerm
                                            ? `No countries found matching "${searchTerm}"`
                                            : maxSelection && selectedCountries.length >= maxSelection
                                                ? `Maximum ${maxSelection} countries selected`
                                                : 'All countries have been selected'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Helper Text */}
            {selectedCountries.length === 0 && required && (
                <p className="text-xs text-slate-500">
                    Select at least one preferred country
                </p>
            )}

            {/* Document Template Info */}
            {selectedCountries.length > 0 && onCountryTemplateApplied && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 flex items-center gap-2">
                        <Globe size={14} />
                        Country-specific document templates will be applied automatically
                    </p>
                </div>
            )}
        </div>
    );
};

export default PreferredCountriesSelector;
