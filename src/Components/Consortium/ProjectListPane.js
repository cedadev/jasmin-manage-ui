import React from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import { LinkContainer } from 'react-router-bootstrap';

import { Status } from '../../rest-resource';

import { SpinnerWithText, formatAmount, sortByKey } from '../utils';


import '../../css/quota-card.css';


const ProjectList = ({ project }) => {
    const numServices = project.data.num_services || 0;
    const numRequirements = project.data.num_requirements || 0;
    return (
    	<>
            <td>{project.data.name}</td> 
            <td>{project.data.status}</td> 
            <td>{numServices}</td> 
            <td>{numRequirements}</td>
		</>
    );
};


export const ListPane = ({ projects }) => {
    // Wait for the projects to load
    return (
        <Status fetchable={projects}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">Loading projects...</SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Status.Throw />
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
                        <Col >
                        <Table hover striped size="sm">
                        	<thead> <th>Project</th> <th>Status</th> <th>Services</th> <th>Requirements</th>
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
                    );
                }}
            </Status.Available>
        </Status>
    );
};

            
