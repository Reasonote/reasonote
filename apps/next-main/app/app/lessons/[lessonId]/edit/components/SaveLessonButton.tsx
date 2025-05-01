import { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Save, Check } from '@mui/icons-material';

interface SaveLessonButtonProps {
    onSave: () => Promise<void>;
}

export function SaveLessonButton({ onSave }: SaveLessonButtonProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave();
            setShowSuccess(true);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to save lesson');
            setShowError(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
            >
                {isSaving ? 'Saving...' : 'Save'}
            </Button>

            {/* Success message */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={3000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setShowSuccess(false)} 
                    severity="success"
                    icon={<Check />}
                    sx={{ width: '100%' }}
                >
                    Lesson saved successfully
                </Alert>
            </Snackbar>

            {/* Error message */}
            <Snackbar
                open={showError}
                autoHideDuration={5000}
                onClose={() => setShowError(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setShowError(false)} 
                    severity="error" 
                    sx={{ width: '100%' }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </>
    );
} 