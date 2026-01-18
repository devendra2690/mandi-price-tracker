
import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseExcel } from '../utils/analytics';

const FileUpload = ({ onDataLoaded }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const processFile = async (file) => {
        setLoading(true);
        setError(null);
        try {
            const data = await parseExcel(file);
            if (data.length === 0) throw new Error("Empty file or invalid format");
            // Artificial delay for "processing" feel
            setTimeout(() => onDataLoaded(data), 800);
        } catch (err) {
            setError(err.message || "Failed to parse file");
            setLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) processFile(files[0]);
    };

    const handleInputChange = (e) => {
        const files = e.target.files;
        if (files.length > 0) processFile(files[0]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel`}
            style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                borderStyle: 'dashed',
                borderWidth: '2px',
                borderColor: isDragOver ? 'var(--accent-primary)' : 'var(--glass-border)',
                backgroundColor: isDragOver ? 'rgba(56, 189, 248, 0.1)' : undefined,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
        >
            <input
                type="file"
                id="fileInput"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={handleInputChange}
            />

            {loading ? (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                    <FileSpreadsheet size={48} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
                </motion.div>
            ) : error ? (
                <div style={{ color: 'var(--danger)' }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p>{error}</p>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Try again</p>
                </div>
            ) : (
                <>
                    <div style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Upload size={32} color="var(--accent-primary)" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Upload Price Data</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Drag & Drop your Excel file here or click to browse
                    </p>
                    <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--bg-primary)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        .XLSX or .XLS format
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default FileUpload;
