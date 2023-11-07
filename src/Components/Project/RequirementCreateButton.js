import React, { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';

import moment from 'moment';

import { useNotifications } from 'react-bootstrap-notify';

import { Form as ResourceForm } from '../../rest-resource';
import { useNestedResource } from '../../rest-resource'; 

import { useCategories, useResources, useConsortia } from '../../api';

import { notificationFromError } from '../utils';


export const RequirementCreateButton = ({ project, service, requirements, ...props }) => {
    const notify = useNotifications();
    const categories = useCategories();
    const resources = useResources();

    // Get the consortium to allow us to access the related quotas
    const consortia = useConsortia();
    const consortium = consortia.data[project.data.consortium];
    const quotas = useNestedResource(consortium, "quotas");
    // Find the resources which have a quota
    const quotaResources = [];
    for (const j in quotas.data) {
        quotaResources.push(quotas.data[j].data.resource)
    }

    // Keep a handle on the currently selected resource
    // We use this to determine whether to show the amount/from/until fields
    const [selectedResourceId, setSelectedResourceId] = useState(null);
    const selectedResource = selectedResourceId ? resources.data[selectedResourceId] : null;

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    // Whenever the modal is hidden, also reset the selected resource
    const hideModal = () => {
        setModalVisible(false);
        setSelectedResourceId(null);
    };

    const handleError = error => {
        notify(notificationFromError(error));
        hideModal();
    };

    // We can safely assume that the categories and resources have been initialised
    // higher up the component tree
    const category = categories.data[service.data.category];
    // Define a filter function that selects only the resources for the category and that have a quota
    const categoryResources = resource => category.data.resources.includes(resource.data.id) && quotaResources.includes(resource.data.id);
    // Define a function to extract the label for a resource
    // Don't forget that short_name is optional!
    const resourceLabel = resource => resource.data.short_name || resource.data.name;
    // Define a function to format the resources in the dropdown
    const formatResourceOption = (option, { context }) => (
        context === 'menu' ? (
            <>
                <strong className="d-block">{resourceLabel(option)}</strong>
                <small className="d-block">{option.data.description}</small>
            </>
        ) : (
            resourceLabel(option)
        )
    );

    // Get the initial start and end dates for the form
    const today = moment().format("YYYY-MM-DD");
    const twoYearsFromToday = moment().add(2, 'years').format("YYYY-MM-DD");
    const initialData = { start_date: today, end_date: twoYearsFromToday };

    const [units, setUnits] = useState("GB");
    

    return (<>
        <div className="text-center p-2 border-top">
            <Button
                variant="success"
                onClick={showModal}
                {...props}
            >
                New requirement
            </Button>
        </div>

        <Modal show={modalVisible} backdrop="static" keyboard={false}>
            <ResourceForm.CreateInstanceForm
                resource={requirements}
                onSuccess={hideModal}
                onError={handleError}
                onCancel={hideModal}
                initialData={initialData}
                units={units}
            >
                <Modal.Header>
                    <Modal.Title>Create a requirement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col xs={2}>Service</Col>
                        <Col>
                            <strong>{category.data.name}</strong>
                            {" / "}
                            {service.data.name}
                        </Col>
                    </Row>
                    <Form.Group controlId="resource">
                        <Form.Label>Resource</Form.Label>
                        <Form.Control
                            as={ResourceForm.Controls.ResourceSelect}
                            resource={resources}
                            resourceName="resource"
                            // Filter the resources to those for the category
                            filterResources={categoryResources}
                            // Use the custom label function
                            getOptionLabel={resourceLabel}
                            required
                            // Use a custom label renderer
                            formatOptionLabel={formatResourceOption}
                            onChange={setSelectedResourceId}
                        />
                        <ResourceForm.Controls.ErrorList />
                    </Form.Group>
                    {/* Only show the other fields once a resource is selected */}
                    {!!selectedResource && (<>
                        <Form.Group controlId="amount">
                            {/* Show the units on the amount field if required */}
                            {selectedResource.data.units ? (
                                <>
                                <Form.Label>Amount required (please select the units)</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        as={ResourceForm.Controls.Input}
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder={`Amount required (${units})`}
                                        required
                                        autoComplete="off"
                                    />
                                    <InputGroup.Append>
                                        <Form.Control
                                            as="select"
                                            value={units}
                                            required
                                            autoComplete="off"
                                            onChange={e => {
                                                setUnits(e.target.value);
                                            }}
                                        >
                                          <option value="GB">GB</option>
                                          <option value="TB">TB</option>
                                        </Form.Control>
                                    </InputGroup.Append>
                                </InputGroup>
                                </>
                            ) : (
                                <>
                                <Form.Label>Amount required</Form.Label>
                                <Form.Control
                                    as={ResourceForm.Controls.Input}
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Amount required"
                                    required
                                    autoComplete="off"
                                />
                                </>
                            )}
                            <ResourceForm.Controls.ErrorList />
                        </Form.Group>
                        <Form.Row>
                            <Form.Group as={Col} controlId="start_date">
                                <Form.Label>From</Form.Label>
                                <Form.Control
                                    as={ResourceForm.Controls.Input}
                                    type="date"
                                    min={today}
                                    required
                                    autoComplete="off"
                                />
                                <ResourceForm.Controls.ErrorList />
                            </Form.Group>
                            <Form.Group as={Col} controlId="end_date">
                                <Form.Label>Until</Form.Label>
                                <Form.Control
                                    as={ResourceForm.Controls.Input}
                                    type="date"
                                    min={today}
                                    required
                                    autoComplete="off"
                                />
                                <ResourceForm.Controls.ErrorList />
                            </Form.Group>
                        </Form.Row>
                    </>)}
                </Modal.Body>
                <Modal.Footer>
                    <ResourceForm.Controls.CancelButton>Cancel</ResourceForm.Controls.CancelButton>
                    <ResourceForm.Controls.SubmitButton>Create</ResourceForm.Controls.SubmitButton>
                </Modal.Footer>
            </ResourceForm.CreateInstanceForm>
        </Modal>
    </>);
};
