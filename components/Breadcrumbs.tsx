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
                // Parallelize fetching
                const [candidates, employers] = await Promise.all([
                    CandidateService.getCandidates(),
                    Promise.resolve(PartnerService.getEmployers()) // Wrap in promise to keep structure consistent if PartnerService becomes async
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
                const name = getBreadcrumbName(value);

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
