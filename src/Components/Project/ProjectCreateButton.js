import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { useNotifications } from 'react-bootstrap-notify';

import { Form as ResourceForm } from '../../rest-resource/components/';

import { useCurrentUser, useConsortia } from '../../api';

import { notificationFromError, MarkdownEditor } from '../utils';


export const ProjectCreateButton = ({ projects }) => {
    const notify = useNotifications();
    const currentUser = useCurrentUser();
    const consortia = useConsortia();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const navigate = useNavigate();

    // When a project is created, redirect to it
    // We don't need to hide the modal as we will be redirected
    const handleSuccess = projectData => {
        navigate(`/projects/${projectData.id}`, { initialData: projectData } );
    };

    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };

    // This function limits the consortia that are available to select
    const consortiumIsAllowed = consortium => currentUser.data.is_staff || consortium.data.is_public;
    // This function formats the options
    const formatConsortiumOption = (option, { context }) => (
        context === 'menu' ? (
            <>
                <strong className="d-block">{option.data.name}</strong>
                <small className="d-block">{option.data.description}</small>
            </>
        ) : (
            option.data.name
        )
    );

    // Mark the markdown editor control into a resource form control
    const MarkdownEditorControl = ResourceForm.Controls.asControl(
        MarkdownEditor,
        evt => evt.target.value
    );

    return (<>
        <Button onClick={showModal} size="lg" variant="success">Start new project</Button>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <ResourceForm.CreateInstanceForm
                resource={projects}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={hideModal}
                // Disable the form if the consortia are not initialised
                disabled={!consortia.initialised}
            >
                <Modal.Header>
                    <Modal.Title>Start a new project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="name">
                        <Form.Label>Project name</Form.Label>
                        <Form.Control
                            as={ResourceForm.Controls.Input}
                            placeholder="My project"
                            required
                            autoComplete="off"
                        />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                    <Form.Group controlId="consortium">
                        <Form.Label>Consortium</Form.Label>
                        <Form.Control
                            as={ResourceForm.Controls.ResourceSelect}
                            resource={consortia}
                            resourceName="consortium"
                            resourceNamePlural="consortia"
                            required
                            // Only show allowed consortia
                            filterResources={consortiumIsAllowed}
                            // Use a custom label renderer
                            formatOptionLabel={formatConsortiumOption}
                        />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                    <Form.Group controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as={MarkdownEditorControl} required />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <ResourceForm.Controls.CancelButton>Cancel</ResourceForm.Controls.CancelButton>
                    <ResourceForm.Controls.SubmitButton>Create</ResourceForm.Controls.SubmitButton>
                </Modal.Footer>
            </ResourceForm.CreateInstanceForm>
        </Modal>
    </>);
};
