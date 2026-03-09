import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const [breadcrumbNames, setBreadcrumbNames] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        const resolveNames = async () => {
            try {
                const names: Record<string, string> = {};
                const [candidates, employers] = await Promise.all([
                    CandidateService.getCandidates(),
                    Promise.resolve(PartnerService.getEmployers())
                ]);

                pathnames.forEach((value, index) => {
                    const prev = index > 0 ? pathnames[index - 1] : '';
                    if (prev === 'candidates') {
                        const candidate = (candidates || []).find(c => c && c.id === value);
                        if (candidate?.name) names[value] = candidate.name;
                    } else if (prev === 'partners') {
                        const partner = (employers || []).find(e => e && e.id === value);
                        if (partner?.companyName) names[value] = partner.companyName;
                    }
                });
                setBreadcrumbNames(names);
            } catch (err) {
                console.error('Failed to resolve breadcrumb names', err);
            }
        };
        resolveNames();
    }, [location.pathname]);

    const getBreadcrumbName = (value: string) => {
        if (breadcrumbNames[value]) return breadcrumbNames[value];
        return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
    };

    if (pathnames.length === 0) return null;

    return (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 overflow-x-auto scrollbar-none">
            <Link to="/" className="hover:text-blue-600 transition-colors shrink-0 btn-touch flex items-center justify-center w-auto min-w-0 p-1">
                <Home size={15} />
            </Link>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const name = getBreadcrumbName(value);

                return (
                    <React.Fragment key={to}>
                        <ChevronRight size={12} className="text-slate-300 shrink-0" />
                        {isLast ? (
                            <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{name}</span>
                        ) : (
                            <Link to={to} className="hover:text-blue-600 transition-colors truncate max-w-[100px] sm:max-w-[160px] md:max-w-none">
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
