import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useNotifications } from 'react-bootstrap-notify';

import classNames from 'classnames';

import moment from 'moment';

import ReactMarkdown from 'react-markdown';


import { Form as ResourceForm } from '../../rest-resource';

import { notificationFromError, MarkdownEditor } from '../utils';

import {
    Status,
    useNestedResource,
    useAggregateResource,
    useFetchPoint,
    useEnsureInitialised
} from '../../rest-resource';

import { useResources } from '../../api';

import { formatAmount, sortByKey } from '../utils';

import { useProjectPermissions } from './actions';

import '../../css/project-detail.css';


const TimelineItem = ({ children }) => (
    <div className="timeline-item">
        <div className="timeline-item-container">
            <div className="timeline-item-content">
                {children}
            </div>
        </div>
    </div>
);


const ProjectDescription = ({ project }) => {

    const notify = useNotifications();
    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);
    // Get the project permissions for description edit
    const {
        canEditRequirements,
        canSubmitForReview,
        canRequestChanges,
        canSubmitForProvisioning
    } = useProjectPermissions(project);

    const navigate = useNavigate();
    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };
    // Mark the markdown editor control into a resource form control
    const MarkdownEditorControl = ResourceForm.Controls.asControl(
        MarkdownEditor,
        evt => evt.target.value,
    );
    return(<>
    <Card>
        <Card.Header><strong>Project description</strong></Card.Header>
        <Card.Body className="markdown">
            <ReactMarkdown children={project.data.description} />
            {canSubmitForReview && (<>
                <Button onClick={showModal} size="sm" variant="outline-primary" style={{float: 'right'}}>edit</Button>
                
                <Modal show={modalVisible} backdrop="static" keyboard={false}>
                    <ResourceForm.UpdateInstanceForm
                        instance={project}
                        field={project.data.description}
                        onSuccess={hideModal}
                        onError={handleError}
                        onCancel={hideModal}
                    >
                        <Modal.Header>
                            <Modal.Title>Edit project description</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            
                            <Form.Group controlId="description">
                                <Form.Label>Description</Form.Label>
                                <Form.Control as={MarkdownEditorControl} required />

                                <ResourceForm.Controls.ErrorList />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <ResourceForm.Controls.CancelButton>Cancel</ResourceForm.Controls.CancelButton>
                            <ResourceForm.Controls.SubmitButton>Confirm</ResourceForm.Controls.SubmitButton>
                        </Modal.Footer>
                    </ResourceForm.UpdateInstanceForm>
                </Modal>
                </>
            )}
        </Card.Body>
    </Card>
    </>
    )
};


const Comment = ({ project, item }) => {
    const displayName = item.data.user.last_name ?
        `${item.data.user.first_name} ${item.data.user.last_name}` :
        item.data.user.username;
    const createdAt = moment(item.data.created_at).format('D MMMM');
    return (
        <Card className="comment">
            <Card.Header>
                <strong>{displayName}</strong> <em>commented on {createdAt}</em>
            </Card.Header>
            <Card.Body className="markdown">
                <ReactMarkdown children={item.data.content} />
            </Card.Body>
        </Card>
    );
};


const EventIcon = ({ icon, variant }) => {
    const variantClassName = !!variant ? `text-${variant}` : undefined;
    return (
        <span className={classNames("event-icon", "fa-stack", variantClassName)}>
            <i className="fas fa-circle fa-stack-2x" />
            <i className={classNames("fas", "fa-stack-1x", "fa-inverse", icon)} />
        </span>
    );
};


const EventText = props => <span className="event-text" {...props} />;


const ProjectEvent = ({ children, item, className }) => {
    const createdBy = item.user.last_name ?
        `${item.user.first_name} ${item.user.last_name}` :
        item.user.username;
    const createdAt = moment(item.created_at).format('D MMMM');
    return (
        <div className={classNames("event", className)}>
            {children(createdBy, createdAt)}
        </div>
    );
};


const ResourceEvent = ({ children, project, requirements, item, ...props }) => {
    const resources = useResources();
    // Force the requirements to load
    useEnsureInitialised(requirements);
    return (
        <Status.Many fetchables={[resources, requirements]}>
            <Status.Loading>
                <div className="event text-muted">
                    <EventIcon icon="fa-sync-alt fa-spin" />
                    <EventText>Loading requirements...</EventText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <div className="event text-danger font-weight-bold">
                    <EventIcon icon="fa-bomb" />
                    <EventText>Unable to load requirements</EventText>
                </div>
            </Status.Unavailable>
            <Status.Available>
                {([resourceData, requirementData]) => {
                    if (requirementData[item.target_id]) {
                        const requirement = requirementData[item.target_id];
                        const resource = resourceData[requirement.data.resource];
                        const amount = formatAmount(requirement.data.amount, resource.data.units);
                        return (
                            <ProjectEvent item={item} {...props}>
                                {(createdBy, createdAt) => children(
                                    amount,
                                    resource.data.name,
                                    createdBy,
                                    createdAt
                                )}
                            </ProjectEvent>
                        );
                    };
                    return (
                        <div className="event">
                            <EventIcon icon="fa-question" variant="light" />
                            <EventText className="text-muted">
                                Event <strong>missing</strong> on {moment(item.created_at).format('D MMMM')}
                            </EventText>
                        </div>
                    );
                }}
            </Status.Available>
        </Status.Many>
    );
};


// Map of timeline events to a component
const TimelineEvents = {
    'jasmin_manage.project.created': props => (
        <ProjectEvent {...props}>
            {(createdBy, createdAt) => (<>
                <EventIcon icon="fa-plus" variant="info" />
                <EventText>
                    Project <strong>created</strong>{" "}
                    on {createdAt}{" "}
                    by <strong>{createdBy}</strong>
                </EventText>
            </>)}
        </ProjectEvent>
    ),
    'jasmin_manage.project.submitted_for_review': props => (
        <ProjectEvent {...props}>
            {(createdBy, createdAt) => (<>
                <EventIcon icon="fa-question" variant="primary" />
                <EventText>
                    Project <strong>submitted for review</strong>{" "}
                    on {createdAt}{" "}
                    by <strong>{createdBy}</strong>
                </EventText>
            </>)}
        </ProjectEvent>
    ),
    'jasmin_manage.project.changes_requested': props => (
        <ProjectEvent {...props}>
            {(createdBy, createdAt) => (<>
                <EventIcon icon="fa-exclamation" variant="danger" />
                <EventText>
                    <strong>Changes requested</strong>{" "}
                    on {createdAt}{" "}
                    by <strong>{createdBy}</strong>
                </EventText>
            </>)}
        </ProjectEvent>
    ),
    'jasmin_manage.project.submitted_for_provisioning': props => (
        <ProjectEvent {...props}>
            {(createdBy, createdAt) => (<>
                <EventIcon icon="fa-check" variant="success" />
                <EventText>
                    Project <strong>submitted for provisioning</strong>{" "}
                    on {createdAt}{" "}
                    by <strong>{createdBy}</strong>
                </EventText>
            </>)}
        </ProjectEvent>
    ),
    'jasmin_manage.requirement.provisioned': props => (
        <ResourceEvent {...props}>
             {(amount, resourceName, createdBy, createdAt) => (<>
                <EventIcon icon="fa-layer-group" variant="secondary" />
                <EventText>
                    <strong>{amount} {resourceName} provisioned</strong>{" "}
                    on {createdAt}
                </EventText>
            </>)}
        </ResourceEvent>
    ),
    'jasmin_manage.requirement.decommissioned': props => (
        <ResourceEvent {...props} className="text-muted">
             {(amount, resourceName, createdBy, createdAt) => (<>
                <EventIcon icon="fa-power-off" />
                <EventText>
                    <strong>{amount} {resourceName} decommissioned</strong>{" "}
                    on {createdAt}
                </EventText>
            </>)}
        </ResourceEvent>
    ),
};


const getTimelineData = (commentData, eventData) => {
    const timelineData = [
        // Start with the comment data
        ...Object.values(commentData).map(comment => ({
            id: `comment-${comment.data.id}`,
            data: comment,
            component: Comment,
            createdAt: comment.data.created_at
        })),
        // Add the event data, but only those with a renderer
        ...eventData
            .filter(event => TimelineEvents.hasOwnProperty(event.event_type))
            .map(event => ({
                id: `event-${event.id}`,
                data: event,
                component: TimelineEvents[event.event_type],
                createdAt: event.created_at
            }))
    ];
    // Return the data sorted by createdAt
    return sortByKey(timelineData, item => item.createdAt, true);
};


const ProjectTimeline = ({ project, events }) => {
    // Load the comments
    const comments = useNestedResource(project, "comments");

    // This is the fetch point for the events
    useFetchPoint(events);

    // In order to render some events, we need the project services and requirements
    // We want to fetch them once for all events, so this needs to be the fetch point
    // However we don't want to load them if we don't need them, so don't auto-fetch
    // This means that individual event components must force them to load using
    // "useEnsureInitialised" if they need them
    const services = useNestedResource(project, "services", { autoFetch: false });
    const requirements = useAggregateResource(services, "requirements", { autoFetch: false });

    return (<>
        {/* If either the comments or events are loading, include an item at the top */}
        {(comments.fetching || events.fetching ) && (
            <TimelineItem>
                <div className="event text-muted">
                    <EventIcon icon="fa-sync-alt fa-spin" />
                    <EventText>Loading timeline items...</EventText>
                </div>
            </TimelineItem>
        )}
        <Status.Many fetchables={[comments, events]}>
            {/* No loading section as this is covered by the item above */}
            <Status.Unavailable>
                <TimelineItem>
                    <div className="event text-danger font-weight-bold">
                        <EventIcon icon="fa-bomb" />
                        <EventText>Error loading timeline data</EventText>
                    </div>
                </TimelineItem>
            </Status.Unavailable>
            <Status.Available>
                {([commentData, eventData]) => (
                    // Render each timeline item with the specified component
                    getTimelineData(commentData, eventData).map(item => (
                        <TimelineItem key={item.id}>
                            <item.component
                                project={project}
                                services={services}
                                requirements={requirements}
                                item={item.data}
                            />
                        </TimelineItem>
                    ))
                )}
            </Status.Available>
        </Status.Many>
    </>);
};


export const OverviewPane = ({ project, events }) => (
    <div className="timeline">
        <TimelineItem>
            <ProjectDescription project={project} />
        </TimelineItem>
        <ProjectTimeline project={project} events={events} />
    </div>
);
