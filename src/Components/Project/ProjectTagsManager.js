import React, { useState, useEffect } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Alert from 'react-bootstrap/Alert';


import { Link } from 'react-router-dom';

import { useNotifications } from 'react-bootstrap-notify';

import { apiFetch, useNestedResource } from '../../rest-resource';

import { useTags } from '../../api';

import { notificationFromError, sortByKey } from '../utils';

import { useProjectPermissions } from './actions';

export const ProjectTagsDisplay = ({ project }) => {
    const {
        canEditRequirements,
        canSubmitForReview,
        canRequestChanges,
        canSubmitForProvisioning,
        canManageTags } = useProjectPermissions(project);
    const tags = useNestedResource(project, "tags");
    const [modalVisible, setModalVisible] = useState(false);

    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

     
    if (!canManageTags) return null;

    return (
        <Card className="mt-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <strong>Project Tags</strong>
                
                {canSubmitForReview && (<Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={showModal}
                >
                    Manage Tags
                </Button>)}
            </Card.Header>
            <ListGroup variant="flush">
                <ListGroup.Item>
                    {Object.keys(tags.data).length === 0 ? (
                        <p className="text-muted mb-0">No tags assigned to this project</p>
                    ) : (
                        <div className="d-flex flex-wrap">
                            {Object.values(tags.data).map(tag => (
                                <Badge 
                                    key={tag.data.id}
                                    variant="secondary" 
                                    className="mr-2 mb-1 p-2"
                                >
                                    {tag.data.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </ListGroup.Item>
                <ListGroup.Item>
                    <p>Tags can be edited for projects when the project is <strong>EDITABLE</strong>. 
                        They can be used to filter the projects in the <Link
                                        className="font-weight-bold"
                                        to={{
                                            pathname: `/all_projects/`
                                        }}
                                    >
                                        All Projects
                                    </Link> tab.</p>
                </ListGroup.Item>
            </ListGroup>

            <TagManagementModal 
                project={project} 
                tags={tags}
                show={modalVisible}
                onHide={hideModal}
            />
        </Card>
    );
};

const TagManagementModal = ({ project, tags, show, onHide }) => {
    const notify = useNotifications();
    const allTags = useTags();
    const [tagName, setTagName] = useState('');
    const [similarTags, setSimilarTags] = useState([]);
    const [isNewTag, setIsNewTag] = useState(true);
    const [selectedTagId, setSelectedTagId] = useState(null);
    
    const handleError = error => {
        notify(notificationFromError(error));
    };

    const handleTagNameChange = (e) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setTagName(value);
        
        if (value.length > 0) {
            const similar = Object.values(allTags.data)
                .filter(tag => tag.data.name.includes(value))
                .map(tag => ({
                    id: tag.data.id,
                    name: tag.data.name
                }));
            setSimilarTags(similar);
            
            const exactMatch = similar.find(tag => tag.name === value);
            if (exactMatch) {
                setIsNewTag(false);
                setSelectedTagId(exactMatch.id);
            } else {
                setIsNewTag(true);
                setSelectedTagId(null);
            }
        } else {
            setSimilarTags([]);
            setIsNewTag(true);
            setSelectedTagId(null);
        }
    };

    const selectSimilarTag = (tagId, tagName) => {
        setTagName(tagName);
        setIsNewTag(false);
        setSelectedTagId(tagId);
    };

     
const getCsrfToken = () => document.cookie
.split('; ')
.find(row => row.startsWith('csrftoken='))
?.split('=')[1];

 
const handleAddTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    try {
        if (isNewTag) {
            // Validate tag name format
            if (!/^[a-z0-9-]+$/.test(tagName)) {
                notify({
                    variant: 'danger',
                    message: 'Tag name must contain only lowercase letters, numbers, and hyphens'
                });
                return;
            }
            
            // Validate minimum length
            if (tagName.length < 3) {
                notify({
                    variant: 'danger',
                    message: 'Tag name must be at least 3 characters long'
                });
                return;
            }
            
            // Validate maximum length
            if (tagName.length > 15) {
                notify({
                    variant: 'danger',
                    message: 'Tag name must be at most 15 characters long'
                });
                return;
            }
            
            // Validate that tag doesn't start or end with hyphen
            if (tagName.startsWith('-') || tagName.endsWith('-')) {
                notify({
                    variant: 'danger',
                    message: 'Tag name cannot start or end with a hyphen'
                });
                return;
            }
            
             
            const response = await apiFetch('/api/tags/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                },
                data: { name: tagName }
            });
            
             
            if (response?.id) {
                await addTagToProject(response.id);
            } else {
                 
                allTags.markDirty();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const newTag = Object.values(allTags.data).find(tag => 
                    tag.data.name === tagName
                );
                
                if (newTag) await addTagToProject(newTag.data.id);
                else throw new Error('Could not find the newly created tag');
            }
        } else {
             
            await addTagToProject(selectedTagId);
        }
        
         
        setTagName('');
        setIsNewTag(true);
        setSelectedTagId(null);
        setSimilarTags([]);
    } catch (error) {
        handleError(error);
    }
};

 
const addTagToProject = async (tagId) => {
    try {
        const currentTagIds = Object.values(tags.data).map(tag => tag.data.id);
        
         
        if (currentTagIds.includes(tagId)) {
            notify({ variant: 'warning', message: 'Tag already assigned to project' });
            return;
        }
        
         
        await apiFetch(`/api/projects/${project.data.id}/`, {
            method: 'PATCH',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json'
            },
            data: { tags: [...currentTagIds, tagId] }
        });
        
        tags.markDirty();
        notify({ variant: 'success', message: 'Tag added successfully' });
    } catch (error) {
        handleError(error);
    }
};

    const removeTag = async (tagId) => {
        try {
             
            const csrftoken = document.cookie
                .split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];
    
             
            await apiFetch(`/api/projects/${project.data.id}/`, {
                method: 'PATCH',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json'
                },
                data: { 
                    tags: Object.values(tags.data)
                        .filter(tag => tag.data.id !== tagId)
                        .map(tag => tag.data.id)
                }
            });
            
            tags.markDirty();
            notify({
                variant: 'success',
                message: 'Tag removed from project successfully'
            });
        } catch (error) {
            handleError(error);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Manage Project Tags</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>Current Tags</h5>
                {Object.keys(tags.data).length === 0 ? (
                    <p className="text-muted">No tags assigned to this project</p>
                ) : (
                    <div className="mb-4">
                        {Object.values(tags.data).map(tag => (
                            <Badge 
                                key={tag.data.id} 
                                variant="secondary" 
                                className="mr-2 mb-2 p-2"
                                style={{ fontSize: '1rem' }}
                            >
                                {tag.data.name}
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="ml-1 p-0 text-white" 
                                    onClick={() => removeTag(tag.data.id)}
                                >
                                    <i className="fas fa-times"></i>
                                </Button>
                            </Badge>
                        ))}
                    </div>
                )}

                <h5>Add Tags</h5>
                <Form onSubmit={handleAddTag} className="mb-4">
                    <Form.Group>
                        <Form.Control
                            type="text"
                            placeholder="Enter tag name"
                            value={tagName}
                            onChange={handleTagNameChange}
                            maxLength={20}
                        />
                        <Form.Text className="text-muted">
                            Tags must be 3-15 characters long, contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.
                        </Form.Text>
                    </Form.Group>
                    
                    {similarTags.length > 0 && (
                        <div className="mt-2 mb-3">
                            <p className="mb-1">Similar tags:</p>
                            <div>
                                {similarTags.map(tag => (
                                    <Badge 
                                        key={tag.id} 
                                        variant={selectedTagId === tag.id ? "primary" : "secondary"}
                                        className="mr-2 mb-2 p-2"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => selectSimilarTag(tag.id, tag.name)}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={!tagName.trim()}
                    >
                        {isNewTag ? 'Add New' : 'Add'}
                    </Button>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};