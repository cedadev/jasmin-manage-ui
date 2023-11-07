import React, { useEffect } from 'react';

import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useParams,
    useResolvedPath,
} from 'react-router-dom';

import Badge from 'react-bootstrap/Badge';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';

import { LinkContainer } from 'react-router-bootstrap';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useNestedResource } from '../../rest-resource';

import { useConsortia, useConsortium } from '../../api';

import { SpinnerWithText, notificationFromError } from '../utils';

import OverviewPane from './OverviewPane';
import ProjectsPane from './ProjectsPane';
import { ListPane } from './ProjectListPane';


const ConsortiumDetail = ({ consortium }) => {
    // We don't want to be reloading resources as the user flips between tabs
    // So load both nested resources here
    const notify = useNotifications();
    const projects = useNestedResource(consortium, "projects");
    const quotas = useNestedResource(consortium, "quotas");

    if( projects.fetchError ) {
        return (
            notify(notificationFromError(projects.fetchError)),
            <Redirect to='/consortia'/>
        );
    }
    if( quotas.fetchError ) {
        return (
            notify(notificationFromError(quotas.fetchError)),
            <Redirect to='/consortia'/>
        );
    }

    const { pathname } = useLocation();
    const path  = useResolvedPath("").pathname

    // Count the number of projects that are under review
    // If we do this before the projects have loaded, we get zero
    const numProjectsUnderReview = Object.values(projects.data)
        .filter(p => p.data.status === "UNDER_REVIEW")
        .length;

    return (<>
        <PageHeader>
            <div className="d-flex align-items-center">
                <span>{consortium.data.name}</span>
                <Badge
                    variant={consortium.data.is_public ? "success" : "danger"}
                    className="ml-4"
                    style={{ fontSize: '60%' }}
                >
                    {consortium.data.is_public ? "Public" : "Not Public"}
                </Badge>
            </div>
        </PageHeader>
        <Row>
            <Col>
                <Nav variant="tabs" className="mb-3" activeKey={pathname}>
                    <Nav.Item>
                        <LinkContainer to={path}>
                            <Nav.Link>Overview</Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                    <Nav.Item>
                        <LinkContainer to={`${path}/projects`}>
                            <Nav.Link>
                                <div className="d-flex align-items-center">
                                    <span>Projects</span>
                                    {numProjectsUnderReview > 0 && (
                                        <Badge pill className="ml-2" variant="danger">
                                            {numProjectsUnderReview}
                                        </Badge>
                                    )}
                                </div>
                            </Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                    <Nav.Item>
                        <LinkContainer to={`${path}/list`}>
                            <Nav.Link>
                                <div className="d-flex align-items-center">
                                    <span>Projects List</span>
                                </div>
                            </Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                </Nav>
                <Routes>
                    <Route exact path={path} element={<OverviewPane quotas={quotas} />} />
                    <Route path={`${path}/projects`} element={<ProjectsPane projects={projects} />} />
                    <Route path={`${path}/list`} element={<ListPane projects={projects} />} />
                </Routes>
            </Col>
        </Row>
    </>);
};


export const ConsortiumDetailWrapper = () => {
    const notify = useNotifications();
    const consortia = useConsortia();

    // Get the consortium id from the path
    const { id: consortiumId } = useParams();

    // Initialise the consortium, using initial data from the consortia
    const initialData = consortia.data[consortiumId]?.data;
    const consortium = useConsortium(consortiumId, { initialData });

    // If the project failed to load, notify the user
    useEffect(
        () => {
            if( consortium.fetchError ) {
                notify(notificationFromError(consortium.fetchError));
            }
        },
        [consortium.fetchError]
    );

    return (
        <Status fetchable={consortium}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading consortium...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Navigate to="/consortia" />
            </Status.Unavailable>
            <Status.Available>
                <ConsortiumDetail consortium={consortium} />
            </Status.Available>
        </Status>
    );
};
