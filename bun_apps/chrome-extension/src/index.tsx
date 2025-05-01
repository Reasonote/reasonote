import { createRoot } from 'react-dom/client';

import { AppContent } from './components/AppContent';
import { AuthGuard } from './components/AuthGuard';
import { SupabaseProvider } from './contexts/SupabaseContext';

// import { SupabaseProvider } from './contexts/SupabaseContext';

// // Wrap the app with the provider
const App = () => (
    <SupabaseProvider>
        <AuthGuard>
            <AppContent />
        </AuthGuard>
    </SupabaseProvider>
);

// Boilerplate code to mount the React app
console.log("Mounting Reasonote extension app.");
const container = document.getElementById('root');
console.log('container', container);
const root = createRoot(container!);
console.log('root', root);
root.render(<App />);