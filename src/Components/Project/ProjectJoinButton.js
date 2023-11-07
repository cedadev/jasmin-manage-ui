import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { useNotifications } from 'react-bootstrap-notify';

import { joinProject } from '../../api';

import { notificationFromError } from '../utils';


export const ProjectJoinButton = () => {
    const notify = useNotifications();

    const navigate = useNavigate();

    const [modalVisible, setModalVisible] = useState(false);
    const [code, setCode] = useState("");
    const [inProgress, setInProgress] = useState(false);
    const [error, setError] = useState(undefined);

    const showModal = () => setModalVisible(true);
    const hideModal = () => {
        setModalVisible(false);
        setCode("");
        setError(undefined);
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setInProgress(true);
        let project;
        try {
            // Attempt to join a project
            project = await joinProject(code);
        }
        catch(error) {
            // For a bad request, the content should be a JSON-formatted error
            if( error.status === 400 ) setError(error.json().detail);
            // For any other errors, produce a notification
            else notify(notificationFromError(error));
            // In both cases we are no longer in progress
            setInProgress(false);
            // Handling the event is done
            return;
        }
        // On success, redirect the user to the project they just joined
        // We don't need to set inProgress to false as we will be unmounted
        navigate(`/projects/${project.id}`, { initialData: project } );
    };

    return (<>
        <Button onClick={showModal} size="lg" className="mt-3">Join existing project</Button>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <Form onSubmit={handleSubmit}>
                <Modal.Header>
                    <Modal.Title>Join an existing project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="code">
                        <Form.Label>Invitation code</Form.Label>
                        <Form.Control
                            placeholder="Invitation code"
                            required
                            autoComplete="off"
                            value={code}
                            onChange={evt => setCode(evt.target.value)}
                            isInvalid={!!error}
                        />
                        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
                        <Form.Text muted>Enter the invitation code that you received via email.</Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={hideModal} disabled={inProgress}>Cancel</Button>
                    <Button type="submit" variant="success" disabled={inProgress}>
                        {inProgress && <i className="fas fa-spin fa-sync-alt mr-2" />}
                        Join project
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    </>);
};
