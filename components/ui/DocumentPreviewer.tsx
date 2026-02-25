import React from 'react';
import { X, Download, Eye, FileText, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface DocumentPreviewerProps {
    url: string;
    title: string;
    fileType?: string;
    onClose: () => void;
}

const DocumentPreviewer: React.FC<DocumentPreviewerProps> = ({ url, title, fileType, onClose }) => {
    const isImage = (url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || fileType?.startsWith('image/'));
    const [zoom, setZoom] = React.useState(100);
    const [rotation, setRotation] = React.useState(0);

    const [artifactId] = React.useState(() => Math.random().toString(36).substring(7).toUpperCase());

    return (
        <div className="fixed inset-0 bg-slate-900/90 flex flex-col z-[60] backdrop-blur-sm">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold leading-none">{title}</h3>
                        <p className="text-blue-400 text-[10px] uppercase font-bold tracking-widest mt-1">Real-time Secure Preview</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-800 rounded-lg p-1">
                        <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1.5 text-slate-400 hover:text-white transition-colors"><ZoomOut size={18} /></button>
                        <span className="text-xs font-mono text-slate-300 w-12 text-center">{zoom}%</span>
                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-1.5 text-slate-400 hover:text-white transition-colors"><ZoomIn size={18} /></button>
                    </div>

                    <button onClick={() => setRotation((rotation + 90) % 360)} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors">
                        <RotateCw size={18} />
                    </button>

                    <div className="h-6 w-px bg-white/10 mx-2" />

                    <a href={url} download className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm transition-all shadow-lg shadow-blue-900/20">
                        <Download size={18} /> Download
                    </a>

                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-black/20">
                <div
                    className="transition-all duration-300 ease-out"
                    style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        maxHeight: '100%',
                        maxWidth: '100%'
                    }}
                >
                    {isImage ? (
                        <img
                            src={url}
                            alt={title}
                            className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl rounded-sm border border-white/5"
                        />
                    ) : (
                        <div className="w-[80vw] h-[80vh] bg-white rounded-sm shadow-2xl overflow-hidden">
                            <iframe
                                src={url}
                                title={title}
                                className="w-full h-full border-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Info */}
            <div className="px-6 py-3 bg-slate-900/50 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                        <Eye size={14} className="text-green-500" />
                        Encrypted View Mode
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Source: Secure Cloud Storage
                    </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">
                    Document Artifact ID: {artifactId}
                </div>
            </div>
        </div>
    );
};

export default DocumentPreviewer;
