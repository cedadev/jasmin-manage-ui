import React, { useEffect, useState } from 'react';

import {
    Redirect,
    Route,
    Switch,
    useLocation,
    useParams,
    useRouteMatch
} from 'react-router-dom';

import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';

import { LinkContainer } from 'react-router-bootstrap';

import classNames from 'classnames';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status } from '../../rest-resource';

import { useProject, useProjectEvents } from '../../api';

import {
    useStateFromLocation,
    SpinnerWithText,
    notificationFromError
} from '../utils';

import { ProjectMetaCard } from './MetaCard';
import { OverviewPane } from './OverviewPane';
import { ServicesPane } from './ServicesPane';


const ProjectDetail = ({ project }) => {
    const { pathname } = useLocation();
    const { path, url } = useRouteMatch();

    // Construct the project events here so they can be shared between panes
    // However we only need this in order to mark the events as dirty
    // The fetch point should be where the events are actually needed
    const events = useProjectEvents(project, { fetchPoint: false });

    return (<>
        <PageHeader>{project.data.name}</PageHeader>
        <Row className={classNames({ "text-muted": project.data.status === "COMPLETED" })}>
            {/* Use custom classes for an xxl breakpoint */}
            <Col xs={12} lg={5} xl={4} className="order-lg-1 col-xxl-3">
                <ProjectMetaCard project={project} events={events} />
            </Col>
            <Col xs={12} lg={7} xl={8} className="order-lg-0 col-xxl-9 my-3">
                <Nav variant="tabs" className="mb-3" activeKey={pathname}>
                    <Nav.Item>
                        <LinkContainer to={url} exact>
                            <Nav.Link>Overview</Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                    <Nav.Item>
                        <LinkContainer to={`${url}/services`}>
                            <Nav.Link>Services</Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                </Nav>
                <Switch>
                    <Route exact path={path}>
                        <OverviewPane project={project} events={events} />
                    </Route>
                    <Route path={`${path}/services`}>
                        <ServicesPane project={project} events={events} />
                    </Route>
                </Switch>
            </Col>
        </Row>
    </>);
};


const ProjectDetailWrapper = () => {
    const notify = useNotifications();

    // Get the project that was specified in the params
    const { id: projectId } = useParams();
    // Get any initial data specified in the location state
    const { initialData } = useStateFromLocation();
    // Initialise the project
    const project = useProject(projectId, { initialData });

    // If the project failed to load, notify the user
    useEffect(
        () => {
            if( project.fetchError ) {
                notify(notificationFromError(project.fetchError));
            }
        },
        [project.fetchError]
    );

    return (
        <Status fetchable={project}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading project...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Redirect to="/projects" />
            </Status.Unavailable>
            <Status.Available>
                <ProjectDetail project={project} />
            </Status.Available>
        </Status>
    );
};


export default ProjectDetailWrapper;
