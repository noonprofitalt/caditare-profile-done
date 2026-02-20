import { supabase } from './supabase';
import { CandidateDocument, DocumentStatus, DocumentCategory, DocumentType } from '../types';

export class DocumentService {
    private static BUCKET_NAME = 'documents';

    /**
     * Uploads a file to Supabase Storage and returns the file metadata.
     * Use this before updating the Candidate profile with the new document record.
     */
    static async uploadDocument(
        file: File,
        candidateId: string,
        docType: DocumentType
    ): Promise<{ path: string; url: string; error?: any }> {
        try {
            // Generate a unique file path: candidateId/docType_timestamp.ext
            const fileExt = file.name.split('.').pop();
            const fileName = `${docType}_${Date.now()}.${fileExt}`;
            const filePath = `${candidateId}/${fileName}`;

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading file:', error);
                return { path: '', url: '', error };
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(filePath);

            return { path: filePath, url: publicUrl };

        } catch (err) {
            console.error('Unexpected error during upload:', err);
            return { path: '', url: '', error: err };
        }
    }

    /**
     * Deletes a document from storage.
     */
    static async deleteDocument(path: string): Promise<{ success: boolean; error?: any }> {
        try {
            const { error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove([path]);

            if (error) {
                console.error('Error deleting file:', error);
                return { success: false, error };
            }

            return { success: true };
        } catch (err) {
            console.error('Unexpected error during delete:', err);
            return { success: false, error: err };
        }
    }
}
