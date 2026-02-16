import React from 'react';

interface MessageSkeletonProps {
    count?: number;
}

/**
 * Skeleton loading component for messages
 * Displays while messages are being loaded
 */
export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ count = 3 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex gap-3 mb-4 animate-pulse">
                    {/* Avatar skeleton */}
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />

                    {/* Message content skeleton */}
                    <div className="flex-1 space-y-2">
                        {/* Name and time */}
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-24 bg-slate-200 rounded" />
                            <div className="h-3 w-16 bg-slate-200 rounded" />
                        </div>

                        {/* Message text */}
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4" />
                            <div className="h-4 bg-slate-200 rounded w-1/2" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default MessageSkeleton;
