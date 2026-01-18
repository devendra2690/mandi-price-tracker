import React, { useState } from 'react';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ExportControls = ({ snapshotRef, dashboardRef }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadSnapshot = async () => {
        if (!snapshotRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(snapshotRef.current, {
                scale: 2, // High resolution
                backgroundColor: '#1e293b', // Match dark theme
                useCORS: true,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `market-snapshot-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Snapshot export failed', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadReport = async () => {
        if (!dashboardRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2,
                backgroundColor: '#111827', // Dashboard background
                useCORS: true,
                logging: false,
                // Ensure charts are fully rendered
                onclone: (clonedDoc) => {
                    // Optional: You could hide certain elements in the PDF here
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height] // Match canvas dimensions exactly for single page view
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`market-report-${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('PDF export failed', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
                onClick={handleDownloadSnapshot}
                disabled={isExporting}
                className="btn glass-panel"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: isExporting ? 'wait' : 'pointer'
                }}
            >
                {isExporting ? <Loader2 className="spin" size={14} /> : <FileImage size={14} />}
                Snapshot
            </button>

            <button
                onClick={handleDownloadReport}
                disabled={isExporting}
                className="btn glass-panel"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: isExporting ? 'wait' : 'pointer'
                }}
            >
                {isExporting ? <Loader2 className="spin" size={14} /> : <FileText size={14} />}
                Report
            </button>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default ExportControls;
