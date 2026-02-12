import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const getBreadcrumbName = (value: string, index: number, pathArray: string[]) => {
        // Check if previous segment invalidates simple capitalization
        const prev = index > 0 ? pathArray[index - 1] : '';

        if (prev === 'candidates') {
            const candidate = CandidateService.getCandidates().find(c => c.id === value);
            return candidate ? candidate.name : value;
        }

        if (prev === 'partners') {
            const partner = PartnerService.getEmployers().find(e => e.id === value);
            return partner ? partner.companyName : value;
        }

        // Default formatting
        return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
    };

    if (pathnames.length === 0) return null;

    return (
        <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">
                <Home size={16} />
            </Link>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const name = getBreadcrumbName(value, index, pathnames);

                return (
                    <React.Fragment key={to}>
                        <ChevronRight size={14} className="text-slate-300" />
                        {isLast ? (
                            <span className="font-semibold text-slate-800">{name}</span>
                        ) : (
                            <Link to={to} className="hover:text-blue-600 transition-colors">
                                {name}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default Breadcrumbs;
