import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image } from 'lucide-react';
import { formatFileSize, validateFileUpload, getFileIcon, isImage } from '../utils/chatUtils';

interface FileUploadProps {
    onFileSelect: (files: File[]) => void;
    maxFiles?: number;
    maxSize?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    maxFiles = 5,
    maxSize = 10 * 1024 * 1024 // 10MB
}) => {
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
    const [errors, setErrors] = React.useState<string[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const validFiles: File[] = [];
        const newErrors: string[] = [];

        acceptedFiles.forEach(file => {
            const validation = validateFileUpload(file, maxSize);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                newErrors.push(`${file.name}: ${validation.error}`);
            }
        });

        if (validFiles.length + selectedFiles.length > maxFiles) {
            newErrors.push(`Maximum ${maxFiles} files allowed`);
            return;
        }

        setSelectedFiles(prev => [...prev, ...validFiles]);
        setErrors(newErrors);
        onFileSelect([...selectedFiles, ...validFiles]);
    }, [selectedFiles, maxFiles, maxSize, onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        maxSize,
    });

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFileSelect(newFiles);
    };

    return (
        <div style={{ width: '100%' }}>
            <div
                {...getRootProps()}
                style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragActive ? '#f0f9ff' : '#fafafa',
                    transition: 'all 0.2s',
                }}
            >
                <input {...getInputProps()} />
                <Upload size={32} style={{ margin: '0 auto 12px', color: '#6b7280' }} />
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
                </p>
                <p style={{ margin: '8px 0 0', color: '#9ca3af', fontSize: '12px' }}>
                    Max {maxFiles} files, {formatFileSize(maxSize)} each
                </p>
            </div>

            {errors.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                    {errors.map((error, i) => (
                        <p key={i} style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0' }}>
                            {error}
                        </p>
                    ))}
                </div>
            )}

            {selectedFiles.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                        Selected Files ({selectedFiles.length})
                    </p>
                    {selectedFiles.map((file, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 12px',
                                background: '#f9fafb',
                                borderRadius: '6px',
                                marginBottom: '8px',
                            }}
                        >
                            {isImage(file.type) ? (
                                <Image size={20} style={{ color: '#6b7280' }} />
                            ) : (
                                <File size={20} style={{ color: '#6b7280' }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.name}
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <X size={16} style={{ color: '#6b7280' }} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
