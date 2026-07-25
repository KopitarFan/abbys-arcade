import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/fredoka';
import App from './App';
import './styles.css';
import './themes/abby.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
