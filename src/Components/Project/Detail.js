import React, { useEffect, useState } from 'react';

import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useParams,
    useResolvedPath
} from 'react-router-dom';

import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';

import { LinkContainer } from 'react-router-bootstrap';

import classNames from 'classnames';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useNestedResource, useAggregateResource } from '../../rest-resource';

import { useProject, useProjectEvents, useCurrentUser, useConsortia } from '../../api';

import {
    useStateFromLocation,
    SpinnerWithText,
    notificationFromError
} from '../utils';

import { ProjectMetaCard } from './MetaCard';
import { OverviewPane } from './OverviewPane';
import { ServicesPane } from './ServicesPane';


export const ProjectDetail = ({ project }) => {
    const { pathname } = useLocation();
    const currentUser = useCurrentUser();
    const consortia = useConsortia();
    const path  = useResolvedPath("").pathname
    
    // Construct the project events here so they can be shared between panes
    // However we only need this in order to mark the events as dirty
    // The fetch point should be where the events are actually needed
    const events = useProjectEvents(project, { fetchPoint: false });

    // See if there are any Rejected requirements in the project
    const services = useNestedResource(project, "services");
    const requirements = useAggregateResource(services, "requirements", { fetchPoint: false });
    var isRejected = false;
    for (const i in requirements.data) {
        if (requirements.data[i].data.status==="REJECTED") {
            isRejected = true;
        }
    }

    // See if the project is in an edible state for project members
    var isEditable = false;
    if (project.data.status==="EDITABLE") {
        isEditable = true;
    }

    // See if the project is under review for consortium managers
    var isUnderReview = false;
    if (project.data.status==="UNDER_REVIEW") {
        isUnderReview = true;
    }

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
                        <LinkContainer to={path}>
                            <Nav.Link>Overview</Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                    <Nav.Item>
                        <LinkContainer to={`${path}/services`}>
                            <Nav.Link>Services</Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                </Nav>
                <Routes>
                    <Route exact path={"/"} element={<OverviewPane project={project} events={events} />} />
                    <Route path={"/services"} element={
                        <>
                        <Status fetchable={consortia}>
                            <Status.Available>
                                {data => {
                                    const consortium = data[project.data.consortium];
                                    const isConsortiumManager = consortium.data.manager.id === currentUser.data.id;
                                    return (<>
                                        {isUnderReview && isConsortiumManager &&
                                             <p>Please click either <b>Request changes</b> or <b>Submit for provisioning</b> once you have made 
                                             decisions on all the requirements for the project.</p>
                                        }
                                        {isRejected && !isConsortiumManager &&
                                             <p>Please <b>delete</b> or <b>edit</b> any rejected requirements before submitting your project for review.</p>
                                        }
                                        { isEditable && !isConsortiumManager &&
                                             <p>Please ensure that you click the <b>Submit for review</b> button once you have added your 
                                              requirements to all services.</p>
                                        }
                                    </>)
                                }}
                            </Status.Available>
                        </Status>
                        <ServicesPane project={project} events={events} />
                        </>
                    }/>
                </Routes>
            </Col>
        </Row>
    </>);
};


export const ProjectDetailWrapper = () => {
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
                <Navigate to="/projects" />
            </Status.Unavailable>
            <Status.Available>
                <ProjectDetail project={project} />
            </Status.Available>
        </Status>
    );
};