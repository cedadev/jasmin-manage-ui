import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import { useNotifications } from 'react-bootstrap-notify';

import { Form as ResourceForm, useNestedResource } from '../../rest-resource';

import { useCategories } from '../../api';

import { notificationFromError } from '../utils';


export const ServiceCreateButton = ({ project, ...props }) => {
    const notify = useNotifications();
    const categories = useCategories();
    const navigate = useNavigate();

    // We only need the create method from the services, so we don't need a fetch point
    const services = useNestedResource(project, "services", { fetchPoint: false });

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    // When a service is created, make sure we are on the services pane
    const handleSuccess = serviceData => {
        navigate(`/projects/${project.data.id}/services`, { scrollTo: serviceData.id } );
        hideModal();
    };

    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };

    // Define a filter function to only show categories that are public
    const categoryIsPublic = category => category.data.is_public;

    // Define a function to format the category options in the dropdown
    const formatCategoryOption = (option, { context }) => (
        context === 'menu' ? (
            <>
                <strong className="d-block">{option.data.name}</strong>
                <small className="d-block">{option.data.description}</small>
            </>
        ) : (
            option.data.name
        )
    );

    return (<>
        <Button
            onClick={showModal}
            size="lg"
            variant="success"
            {...props}
        >
            Add service
        </Button>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <ResourceForm.CreateInstanceForm
                resource={services}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={hideModal}
                // Disable the form if the categories are not initialised
                disabled={!categories.initialised}
            >
                <Modal.Header>
                    <Modal.Title>Create a service</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="category">
                        <Form.Label>Category</Form.Label>
                        <Form.Control
                            as={ResourceForm.Controls.ResourceSelect}
                            resource={categories}
                            resourceName="category"
                            resourceNamePlural="categories"
                            filterResources={categoryIsPublic}
                            required
                            // Use a custom label renderer
                            formatOptionLabel={formatCategoryOption}
                        />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                    <Form.Group controlId="name">
                        <Form.Label>Service name</Form.Label>
                        <Form.Control
                            as={ResourceForm.Controls.Input}
                            placeholder="myservice"
                            required
                            autoComplete="off"
                        />
                        <Form.Text>Please use a short but descriptive name.</Form.Text>
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
