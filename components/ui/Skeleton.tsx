import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
    if (count > 1) {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={`animate-pulse bg-slate-200 rounded ${className}`}
                    />
                ))}
            </>
        );
    }

    return (
        <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
    );
};

export default Skeleton;
