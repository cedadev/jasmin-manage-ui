import React, { useEffect, useMemo } from 'react';

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';

import Notifications from 'react-bootstrap-notify';

import { Provider, useCurrentUser } from '../api';

import { SpinnerWithText } from './utils';

import Navbar from './Navbar';
import Home from './Home';
import { ProjectList } from './Project/List';
import { ProjectDetailWrapper as ProjectDetail} from './Project/Detail';
import { RequirementDetailWrapper as RequirementDetail } from './Project/Requirement';
import { ConsortiumList } from './Consortium/List';
import { ConsortiumDetailWrapper as ConsortiumDetail } from './Consortium/Detail';
import NotFoundPage from './NotFound';

import '../css/notifications.css';
import '../css/xxl-breakpoint.css';


const AuthenticatedComponent = ({ children }) => {
    const currentUser = useCurrentUser();
    const location = useLocation();

    const notAuthenticated = useMemo(
        () => (
            // If there is a fetch in progress, wait for it to finish before deciding
            // if the user is authenticated
            !currentUser.fetching &&
            // If there is no error, or there is but it is not an authentication error,
            // then assume we are authenticated
            // Some auth schemes use 401 to indicate lack of credentials, and some use
            // 403 with a code of not_authenticated - we need to catch both
            currentUser.fetchError &&
            ([401, 403].includes(currentUser.fetchError.status)) &&
            (
                currentUser.fetchError.status === 401 ||
                currentUser.fetchError.json().code === "not_authenticated"
            )
        ),
        [currentUser]
    );

    // If the user is not authenticated, redirect them to the authentication
    useEffect(
        () => {
            if( notAuthenticated ) window.location = `/auth/login/?next=${location.pathname}`;
        },
        [notAuthenticated, location.pathname]
    );

    if( currentUser.initialised ) {
        return children;
    }
    else if( notAuthenticated ) {
        // If we are about to redirect, don't show anything
        return null;
    }
    else if( currentUser.fetchError ) {
        return <Alert variant="danger">Error fetching current user.</Alert>
    }
    else {
        return (
            <div className="d-flex justify-content-center my-5">
                <SpinnerWithText iconSize="lg" textSize="lg">Initialising...</SpinnerWithText>
            </div>
        );
    }
};


const AuthenticatedRoute = ({ children, ...props }) => (
    <Route {...props}>
        <AuthenticatedComponent>{children}</AuthenticatedComponent>
    </Route>
);


const App = () => (
    <Provider>
        <Router>
            <Navbar />
            <Notifications />
            <Container fluid>
                <Routes>
                    <Route exact path="/" element={<Home />} />
                    <Route exact path="/consortia" element={<AuthenticatedComponent><ConsortiumList /></AuthenticatedComponent>} />
                    <Route path="/consortia/:id/*" element={<AuthenticatedComponent><ConsortiumDetail /></AuthenticatedComponent>} />
                    <Route exact path="/projects" element={<AuthenticatedComponent><ProjectList /></AuthenticatedComponent>} />
                    <Route path="/projects/:id/*" element={<AuthenticatedComponent><ProjectDetail /></AuthenticatedComponent>} />
                    <Route path="/request/service-:id/*" element={<AuthenticatedComponent><RequirementDetail /></AuthenticatedComponent>} />
                    <Route path="*"element={<NotFoundPage />} />
                </Routes>
            </Container>
        </Router>
    </Provider>
);


export default App;
