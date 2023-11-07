import React from 'react';
import ReactDOM from 'react-dom/client';

import { NotificationProvider } from 'react-bootstrap-notify';

import JasminApp from 'fwtheme-react-jasmin';

import App from './Components';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <JasminApp>
            <NotificationProvider>
                <App />
            </NotificationProvider>
        </JasminApp>
    </React.StrictMode>
);
