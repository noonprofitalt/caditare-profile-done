import React, { useState } from 'react';
import { Plus, X, Phone, AlertCircle } from 'lucide-react';

interface MultiPhoneInputProps {
    primaryPhone: string;
    whatsappPhone?: string;
    additionalPhones?: string[];
    onPrimaryPhoneChange: (value: string) => void;
    onWhatsappPhoneChange: (value: string) => void;
    onAdditionalPhonesChange: (phones: string[]) => void;
    onDuplicateDetected?: (phone: string, duplicateType: 'primary' | 'whatsapp' | 'additional') => void;
}

const MultiPhoneInput: React.FC<MultiPhoneInputProps> = ({
    primaryPhone,
    whatsappPhone = '',
    additionalPhones = [],
    onPrimaryPhoneChange,
    onWhatsappPhoneChange,
    onAdditionalPhonesChange,
    onDuplicateDetected
}) => {
    const [newPhone, setNewPhone] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Sri Lankan phone number validation (frictionless)
    const validateSriLankanPhone = (phone: string): { valid: boolean; message?: string } => {
        return { valid: true };
    };

    const formatPhoneNumber = (phone: string): string => {
        const cleaned = phone.replace(/[\s-()]/g, '');

        if (cleaned.startsWith('+94')) {
            // +94 77 123 4567
            return cleaned.replace(/(\+94)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
        } else if (cleaned.startsWith('0')) {
            // 077 123 4567
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        } else {
            // 77 123 4567
            return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
        }
    };

    // Check for duplicates (Frictionless: Ignored)
    const checkDuplicate = (phone: string, type: 'primary' | 'whatsapp' | 'additional'): boolean => {
        return false;
    };

    // Handle primary phone change
    const handlePrimaryPhoneChange = (value: string) => {
        const validation = validateSriLankanPhone(value);

        if (!validation.valid && value !== '') {
            setValidationErrors({ ...validationErrors, primary: validation.message || '' });
        } else {
            const { primary, ...rest } = validationErrors;
            setValidationErrors(rest);
        }

        onPrimaryPhoneChange(value);
    };

    // Handle WhatsApp phone change
    const handleWhatsappPhoneChange = (value: string) => {
        const validation = validateSriLankanPhone(value);

        if (!validation.valid && value !== '') {
            setValidationErrors({ ...validationErrors, whatsapp: validation.message || '' });
        } else {
            const { whatsapp, ...rest } = validationErrors;
            setValidationErrors(rest);
        }

        onWhatsappPhoneChange(value);
    };

    // Add additional phone
    const handleAddPhone = () => {
        if (!newPhone) return;

        const validation = validateSriLankanPhone(newPhone);
        if (!validation.valid) {
            setValidationErrors({ ...validationErrors, new: validation.message || '' });
            return;
        }

        if (checkDuplicate(newPhone, 'additional')) {
            setValidationErrors({ ...validationErrors, new: 'This phone number is already added' });
            return;
        }

        onAdditionalPhonesChange([...additionalPhones, newPhone]);
        setNewPhone('');
        const { new: _, ...rest } = validationErrors;
        setValidationErrors(rest);
    };

    // Remove additional phone
    const handleRemovePhone = (index: number) => {
        const updated = additionalPhones.filter((_, i) => i !== index);
        onAdditionalPhonesChange(updated);
    };

    return (
        <div className="space-y-4">
            {/* Primary Phone */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="tel"
                        value={primaryPhone}
                        onChange={(e) => handlePrimaryPhoneChange(e.target.value)}
                        placeholder="+94771234567 or 0771234567"
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.primary ? 'border-red-500' : 'border-slate-300'
                            }`}
                    />
                </div>
                {validationErrors.primary && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {validationErrors.primary}
                    </p>
                )}
            </div>

            {/* WhatsApp Phone */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    WhatsApp Number
                </label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                    <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => handleWhatsappPhoneChange(e.target.value)}
                        placeholder="+94771234567 or 0771234567"
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${validationErrors.whatsapp ? 'border-red-500' : 'border-slate-300'
                            }`}
                    />
                </div>
                {validationErrors.whatsapp && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {validationErrors.whatsapp}
                    </p>
                )}
            </div>

            {/* Additional Contact Numbers */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Contact Numbers
                </label>

                {/* Existing Additional Phones */}
                {additionalPhones.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {additionalPhones.map((phone, index) => (
                            <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <Phone size={16} className="text-slate-400" />
                                <span className="flex-1 text-sm text-slate-700">{formatPhoneNumber(phone)}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemovePhone(index)}
                                    className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                                    title="Remove phone number"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Phone */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="tel"
                                value={newPhone}
                                onChange={(e) => {
                                    setNewPhone(e.target.value);
                                    const { new: _, ...rest } = validationErrors;
                                    setValidationErrors(rest);
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddPhone();
                                    }
                                }}
                                placeholder="Add another number"
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.new ? 'border-red-500' : 'border-slate-300'
                                    }`}
                            />
                        </div>
                        {validationErrors.new && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {validationErrors.new}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddPhone}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add
                    </button>
                </div>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-slate-500">
                Accepted formats: +94771234567, 0771234567, or 771234567
            </p>
        </div>
    );
};

export default MultiPhoneInput;
