import React, {useState} from 'react';

import Alert from 'react-bootstrap/Alert';

import { Col, Row, Card, ListGroup, ListGroupItem } from 'react-bootstrap';

import Table from 'react-bootstrap/Table';

import { LinkContainer } from 'react-router-bootstrap';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useNestedResource } from '../../rest-resource';

import { useProjects, useCurrentUser } from '../../api';

import { sortByKey, SpinnerWithText, notificationFromError } from '../utils';

import { ProjectTagItem, TagConsortiumItem } from '../Project/CardItems';


// Data for the project list
const ProjectList = ({ project }) => {
    // Find the tags associated with the project
    const tags = useNestedResource(project, "tags");
    return (
    	<>
            <td>{project.data.name}</td> 
            <td><TagConsortiumItem project={project} /></td>
            <td><ProjectTagItem tags={tags} /></td>
		</>
    );
};

// Filter button, should be a dropdown selection
const Filter =() => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button>Filter</button>
        </div>
    );
};

// List projects and their tags
const TagList = () => {
    const projects = useProjects();
    // The list should only be visible to staff and maybe consortium managers
    const currentUser = useCurrentUser();

    return (<>
        <PageHeader>Tagged Projects</PageHeader>
        <Status fetchable={projects}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading projects...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Alert variant="danger">Unable to load projects.</Alert>
            </Status.Unavailable>
            <Status.Available>
                {data => {
                    // Sort the projects  by name
                    const sortedProjects = sortByKey(
                        Object.values(data),
                        project => [
                            project.data.name
                        ]
                    );
                    return (
                        <Row>
                            <Col md={10}>
                            <Table hover striped size="sm">
                        	    <thead> <th>Project</th> <th>Consortium</th> <th>Tags</th>
    						    </thead>
    						    <tbody>
                            	    {sortedProjects.map(project => (
                            	        <LinkContainer to={{
					                        pathname: `/projects/${project.data.id}`,
					                        state: { initialData: project.data }
					                    }}>
	                                	    <tr key={project.data.name}>
	                                    	    <ProjectList project={project} />
	                                	    </tr>
                                	    </LinkContainer>
                        		    ))}
    						    </tbody>
                            </Table>
                            </Col>
                            <Col>
                                <Card className="mb-3" style={{ borderWidth: '3px' }}>
                                    <Card.Header>
                                         <h5 className="mb-0">Filter Projects</h5>
                                    </Card.Header>
                                    <ListGroup variant="flush" className="border-0">
                                        <ListGroupItem>
                                            <h6>Filter by consortium</h6>
                                            <Filter />
                                        </ListGroupItem>
                                        <ListGroupItem><h6>Filter by tag</h6></ListGroupItem>
                                    </ListGroup>
                                </Card>
                            </Col>
                        </Row>
                    );
                }}
            </Status.Available>
        </Status>
    </>);
};


export default TagList;