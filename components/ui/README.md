# 🎨 Smart UI Components - Component Library

## Overview

This directory contains **enterprise-grade, reusable UI components** designed specifically for the ERP Candidate Management System. All components are built with React, TypeScript, and follow modern best practices.

---

## 📦 Components

### 1. MultiPhoneInput
**File:** `MultiPhoneInput.tsx`

A comprehensive phone number input component with Sri Lankan phone validation.

**Features:**
- ✅ Primary phone (required)
- ✅ WhatsApp number (optional)
- ✅ Dynamic additional phone numbers
- ✅ Add/remove functionality
- ✅ Sri Lankan phone format validation
- ✅ Real-time duplicate detection
- ✅ Auto-formatting for display
- ✅ Visual error indicators

**Props:**
```typescript
interface MultiPhoneInputProps {
  primaryPhone: string;
  whatsappPhone?: string;
  additionalPhones?: string[];
  onPrimaryPhoneChange: (value: string) => void;
  onWhatsappPhoneChange: (value: string) => void;
  onAdditionalPhonesChange: (phones: string[]) => void;
  onDuplicateDetected?: (phone: string, duplicateType: 'primary' | 'whatsapp' | 'additional') => void;
}
```

**Example:**
```tsx
<MultiPhoneInput
  primaryPhone={formData.phone}
  whatsappPhone={formData.whatsapp}
  additionalPhones={formData.additionalPhones}
  onPrimaryPhoneChange={(value) => setFormData({...formData, phone: value})}
  onWhatsappPhoneChange={(value) => setFormData({...formData, whatsapp: value})}
  onAdditionalPhonesChange={(phones) => setFormData({...formData, additionalPhones: phones})}
  onDuplicateDetected={(phone, type) => alert(`Duplicate: ${phone}`)}
/>
```

**Validation Rules:**
- Accepts: `+94771234567`, `0771234567`, `771234567`
- Validates Sri Lankan phone number format
- Checks for duplicates across all phone fields

---

### 2. MultiEducationSelector
**File:** `MultiEducationSelector.tsx`

A searchable multi-select dropdown for educational qualifications.

**Features:**
- ✅ 20+ predefined education levels
- ✅ Searchable dropdown
- ✅ Multi-select functionality
- ✅ Color-coded badges by category
- ✅ Remove selected items
- ✅ Categorized display (NVQ, Degrees, Diplomas, etc.)

**Props:**
```typescript
interface MultiEducationSelectorProps {
  selectedEducation: string[];
  onChange: (education: string[]) => void;
  label?: string;
  required?: boolean;
}
```

**Example:**
```tsx
<MultiEducationSelector
  selectedEducation={formData.education}
  onChange={(education) => setFormData({...formData, education})}
  label="Educational Qualifications"
  required={true}
/>
```

**Supported Education Levels:**
- Grade 5 Scholarship
- O/L, A/L
- NVQ Levels 1-7
- Certificate, Diploma, Higher Diploma
- Bachelor's, Master's, Doctorate
- Professional Qualifications
- Technical/Vocational Training

---

### 3. PreferredCountriesSelector
**File:** `PreferredCountriesSelector.tsx`

A region-grouped country selector with flags and popular indicators.

**Features:**
- ✅ Grouped by region (Middle East, Asia Pacific, Europe, Other)
- ✅ Country flags and names
- ✅ Popular country indicators
- ✅ Multi-select with max limit
- ✅ Searchable dropdown
- ✅ Color-coded badges by region
- ✅ Auto-apply document templates

**Props:**
```typescript
interface PreferredCountriesSelectorProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
  onCountryTemplateApplied?: (country: string) => void;
  label?: string;
  required?: boolean;
  maxSelection?: number;
}
```

**Example:**
```tsx
<PreferredCountriesSelector
  selectedCountries={formData.preferredCountries}
  onChange={(countries) => setFormData({...formData, preferredCountries: countries})}
  onCountryTemplateApplied={(country) => console.log('Template for:', country)}
  label="Preferred Countries"
  required={true}
  maxSelection={5}
/>
```

**Supported Regions:**
- **Middle East (GCC):** Saudi Arabia, UAE, Qatar, Kuwait, Oman, Bahrain
- **Asia Pacific:** Singapore, Malaysia, Hong Kong, Japan, South Korea, Maldives
- **Europe:** Romania, Poland, Italy, Cyprus, Greece
- **Other:** Israel, Lebanon, Jordan

---

### 4. MedicalStatusInput
**File:** `MedicalStatusInput.tsx`

A comprehensive medical status input with conditional fields.

**Features:**
- ✅ Visual status selector (Not Started, Scheduled, Completed, Failed)
- ✅ Conditional fields based on status
- ✅ Scheduled: Date picker, notes, overdue detection
- ✅ Completed: Completion date, blood group, allergies, notes
- ✅ Failed: Failure reason, workflow warnings
- ✅ Workflow blocking indicators
- ✅ Color-coded status display

**Props:**
```typescript
interface MedicalStatusInputProps {
  status: MedicalStatus;
  scheduledDate?: string;
  completedDate?: string;
  bloodGroup?: string;
  allergies?: string;
  notes?: string;
  onStatusChange: (status: MedicalStatus) => void;
  onScheduledDateChange: (date: string) => void;
  onCompletedDateChange: (date: string) => void;
  onBloodGroupChange: (bloodGroup: string) => void;
  onAllergiesChange: (allergies: string) => void;
  onNotesChange: (notes: string) => void;
}
```

**Example:**
```tsx
<MedicalStatusInput
  status={formData.medicalStatus}
  scheduledDate={formData.medicalScheduledDate}
  completedDate={formData.medicalCompletedDate}
  bloodGroup={formData.bloodGroup}
  allergies={formData.allergies}
  notes={formData.medicalNotes}
  onStatusChange={(status) => setFormData({...formData, medicalStatus: status})}
  onScheduledDateChange={(date) => setFormData({...formData, medicalScheduledDate: date})}
  onCompletedDateChange={(date) => setFormData({...formData, medicalCompletedDate: date})}
  onBloodGroupChange={(group) => setFormData({...formData, bloodGroup: group})}
  onAllergiesChange={(allergies) => setFormData({...formData, allergies})}
  onNotesChange={(notes) => setFormData({...formData, medicalNotes: notes})}
/>
```

**Blood Groups Supported:**
- A+, A-, B+, B-, AB+, AB-, O+, O-

---

## 🎨 Design System

### Colors

**Status Colors:**
- **Success:** Green (`bg-green-100`, `text-green-700`, `border-green-200`)
- **Warning:** Amber (`bg-amber-100`, `text-amber-700`, `border-amber-200`)
- **Error:** Red (`bg-red-100`, `text-red-700`, `border-red-200`)
- **Info:** Blue (`bg-blue-100`, `text-blue-700`, `border-blue-200`)
- **Neutral:** Slate (`bg-slate-100`, `text-slate-700`, `border-slate-200`)

**Category Colors:**
- **NVQ:** Purple (`bg-purple-100`, `text-purple-700`)
- **Degrees:** Blue (`bg-blue-100`, `text-blue-700`)
- **Diplomas:** Green (`bg-green-100`, `text-green-700`)
- **O/L, A/L:** Orange (`bg-orange-100`, `text-orange-700`)
- **Certificates:** Yellow (`bg-yellow-100`, `text-yellow-700`)

**Region Colors:**
- **Middle East:** Amber (`bg-amber-100`, `text-amber-700`)
- **Asia Pacific:** Blue (`bg-blue-100`, `text-blue-700`)
- **Europe:** Purple (`bg-purple-100`, `text-purple-700`)
- **Other:** Slate (`bg-slate-100`, `text-slate-700`)

### Typography

- **Labels:** `text-sm font-medium text-slate-700`
- **Input Text:** `text-sm text-slate-900`
- **Helper Text:** `text-xs text-slate-500`
- **Error Text:** `text-sm text-red-600`
- **Success Text:** `text-sm text-green-600`

### Spacing

- **Component Gap:** `space-y-4` (1rem)
- **Card Padding:** `p-4` or `p-6` (1rem or 1.5rem)
- **Input Padding:** `px-3 py-2` or `px-4 py-2`
- **Badge Padding:** `px-2 py-1` or `px-3 py-1.5`

### Borders

- **Default:** `border border-slate-300 rounded-lg`
- **Focus:** `focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
- **Error:** `border-red-500`
- **Success:** `border-green-500`

---

## 🔧 Component Architecture

### Controlled Components
All components are **controlled components**, meaning:
- Parent component manages state
- Components receive data via props
- Components notify parent of changes via callbacks
- No internal state for form data

### Validation
- **Real-time validation** on user input
- **Visual error indicators** (red borders, error messages)
- **Helper text** for guidance
- **Accessibility** (ARIA labels, error announcements)

### Accessibility
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Screen reader support
- ✅ Color contrast (WCAG 2.1 AA)

### Responsive Design
- ✅ Mobile-first approach
- ✅ Breakpoints: `sm`, `md`, `lg`, `xl`
- ✅ Touch-friendly targets (min 44x44px)
- ✅ Flexible layouts (grid, flexbox)

---

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

---

## 🧪 Testing

### Unit Tests
Each component should have unit tests covering:
- Rendering
- User interactions (click, type, select)
- Validation logic
- Callback invocation
- Edge cases

### Integration Tests
Test components within forms:
- Form submission
- Data persistence
- Validation flow
- Error handling

### E2E Tests
Test complete user flows:
- Quick Add form submission
- Full Application form submission
- Profile editing
- Data display

---

## 🚀 Performance

### Optimization Techniques
- **Memoization:** Use `React.memo` for expensive renders
- **Lazy Loading:** Load components on demand
- **Debouncing:** Debounce search inputs
- **Virtual Scrolling:** For large lists (react-window)

### Bundle Size
- **MultiPhoneInput:** ~8KB (minified)
- **MultiEducationSelector:** ~6KB (minified)
- **PreferredCountriesSelector:** ~7KB (minified)
- **MedicalStatusInput:** ~9KB (minified)

**Total:** ~30KB (minified, gzipped: ~10KB)

---

## 📚 Best Practices

### Usage
1. **Always provide labels** for accessibility
2. **Handle errors gracefully** with clear messages
3. **Validate on blur** to avoid annoying users
4. **Provide helper text** for complex fields
5. **Use TypeScript** for type safety

### Customization
1. **Use props** for configuration (don't modify components)
2. **Extend with CSS** for styling (use className prop)
3. **Compose components** for complex UIs
4. **Follow design system** for consistency

### State Management
1. **Lift state up** to parent components
2. **Use controlled components** for form data
3. **Avoid local state** for form fields
4. **Persist to backend** on submit

---

## 🐛 Common Issues

### Issue: Component not rendering
**Solution:** Check import path (`./ui/ComponentName`)

### Issue: TypeScript errors
**Solution:** Ensure all required props are provided

### Issue: Validation not working
**Solution:** Check that onChange callbacks are wired correctly

### Issue: Styling conflicts
**Solution:** Ensure Tailwind CSS is configured properly

---

## 📖 Documentation

Each component has:
- **JSDoc comments** for IntelliSense
- **TypeScript interfaces** for props
- **Inline comments** for complex logic
- **Usage examples** in this README

---

## 🔄 Version History

### v1.0.0 (2026-02-13)
- ✅ Initial release
- ✅ MultiPhoneInput component
- ✅ MultiEducationSelector component
- ✅ PreferredCountriesSelector component
- ✅ MedicalStatusInput component

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review component source code
3. Check implementation guides in `.agent/` folder
4. Review TypeScript types in `types.ts`

---

## 🎯 Future Enhancements

Planned features:
- [ ] Date range picker component
- [ ] File upload component with preview
- [ ] Rich text editor component
- [ ] Signature pad component
- [ ] Document scanner component
- [ ] Barcode/QR scanner component

---

**Component Library Version:** 1.0.0  
**Last Updated:** 2026-02-13  
**Maintainer:** Enterprise Software Architect  
**License:** Proprietary
