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
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

import classNames from 'classnames';

import ReactMarkdown from 'react-markdown';

import { useNotifications } from 'react-bootstrap-notify';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useNestedResource} from '../../rest-resource';


import { useRequirement, 
  		 useService,
  		 useProject, 
  		 useCategory,
  		 useResources
} from '../../api';

import {
    useStateFromLocation,
    SpinnerWithText,
    notificationFromError,
    sortByKey
} from '../utils';
import { OverviewPane } from './OverviewPane';

const statusOrdering = [
    'REQUESTED',
    'REJECTED',
    'APPROVED',
    'AWAITING_PROVISIONING',
    'PROVISIONED',
    'DECOMMISSIONED'
];

const ProjectDescription = ({ project }) => (
    <Card>
        <Card.Body className="markdown">
            <ReactMarkdown children={project.data.description} />
        </Card.Body>
    </Card>
);

const RequirementRow = ({ requirement }) => {
	const resources = useResources();
    const resource = resources.data[requirement.data.resource];
    return(
    	<tr>
    	{requirement.data.status == `AWAITING_PROVISIONING` &&
    	<>
    	<td></td>
    	<td>{resource.data.short_name} ({resource.data.name})</td>
    	<td>{requirement.data.amount} {resource.data.units}</td>
    	<td>{requirement.data.location == `cloud-beta.jasmin.ac.uk` ? `MCP`: 
    			requirement.data.location == `cloud.jasmin.ac.uk` ? `VIO`: 
    			requirement.data.location}</td>
    	<td>{requirement.data.status.replace("_", " ").toLowerCase()}</td>
    	<td></td>
    	</>
    	}
    	</tr>
    )
}

const RequirementsTable = ({ requirements}) => {
 	// initialise the service
    // Get any initial data specified in the location state   
    
    
	const resources = useResources();
    const sortedRequirements = sortByKey(
        Object.values(requirements.data),
        // Sort requirements by status first, then resource short name
        // This makes sure that the requirements that require action are closest to the top
        requirement => {
            const resource = resources.data[requirement.data.resource];
            const resourceName = resource.data.short_name || resource.data.name;
            return [statusOrdering.indexOf(requirement.data.status), resourceName];
        }
    );                
					
	return (
		<Table>
		<thead>
		<tr>
    	<td></td>
		<th> Resource </th>
		<th> Amount </th>
		<th> Location </th>
		<th> Status </th>
    	<td></td>
		</tr>
		</thead>
		<tbody>
		{sortedRequirements.map(requirement => (
                    <RequirementRow requirement={requirement} />
                ))}
        </tbody>
      	</Table>
    )
    
};

const RequirementDetail = ({service, project, category, collaborators}) => {
	const sortedCollaborators = sortByKey(
        Object.values(collaborators.data),
        // Sort requirements by status first, then resource short name
        // This makes sure that the requirements that require action are closest to the top
        collaborator => [collaborator.data.username]
        );
    const requirements = useNestedResource(service, "requirements");
    const resources = useResources();
    return (
    	<Status.Many fetchables={[ requirements, collaborators, resources ]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading requirements, collaborators...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Row> <Col> No matching requirements, collaborator, resources for service id {service.data.id}</Col> </Row>
            </Status.Unavailable>
            <Status.Available>
            	<>
			    <PageHeader><h3>{ category.data.name } request for  service: { service.data.name }</h3>
			    </PageHeader>
			    <Row> <Col> Service Type: <strong>{category.data.name}</strong> </Col> </Row>
			    <Row> <Col> Service Name: <strong>{service.data.name}</strong> </Col> </Row>
                <Row><Col> Project: <strong>{project.data.name}</strong></Col></Row>
			    {sortedCollaborators.map(collaborator => (
			    <>
			    {collaborator.data.role == `OWNER` &&
			    <>
			    <Row><Col>User: <strong>{collaborator.data.user.username}</strong></Col></Row>
			    <Row><Col>Name: <strong>{collaborator.data.user.first_name} {collaborator.data.user.last_name} </strong></Col></Row>
			    <Row><Col>Email: <strong>{collaborator.data.user.email} </strong></Col></Row>
			    </>
			    }
                
			    </>
			    ))}	
                <Row><Col>Project Description:</Col></Row>
			    <Row><Col> <ProjectDescription project={project} /> </Col></Row>	    
	            <Row>          
	        		<RequirementsTable requirements={requirements} />
	        	</Row>
            	</>
	        
            </Status.Available>
        </Status.Many>
    );
};

const RequirementCollabWrapper = ({ service, project, category }) => {
	
    const collaborators = useNestedResource(project, "collaborators");
    
	
          
    return (
    	<Status fetchable={collaborators}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading project, category...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Row> <Col> No matching collaborator for service id {service.data.id}</Col> </Row>
                
            </Status.Unavailable>
            <Status.Available>
                <RequirementDetail service={service} project={project} category={category} collaborators={collaborators} />
            </Status.Available>
        </Status>
    );
};

const RequirementProjectWrapper = ({ service }) => {
 	// initialise the service
    // Get any initial data specified in the location state
    const { initialData } = useStateFromLocation();
    // Get project for service
    const projectID = service.data.project;
	const project = useProject(projectID, { initialData });
	// Get category for service
	const categoryID = service.data.category;
	const category = useCategory(categoryID, { initialData });
	return (
        <Status.Many fetchables={[project, category]}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading project, category...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Row> <Col> No matching project, or category for service id {service.data.id}</Col> </Row>
                
            </Status.Unavailable>
            <Status.Available>
                <RequirementCollabWrapper service={service} project={project} category={category} />
            </Status.Available>
        </Status.Many>
    );
};


export const RequirementDetailWrapper = () => {
    // at top level use service to produce the requirements for the given service

    // Get the project and requirement that was specified in the params
    const { id: serviceId } = useParams();
    // Get any initial data specified in the location state
    const { initialData } = useStateFromLocation();
    // Initialise the requirement
    const service = useService(serviceId, { initialData }); 
   
    return (
        <Status fetchable={service}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="lg">
                        Loading service...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Row> <Col> No matching service for id {serviceId}</Col> </Row>
                
            </Status.Unavailable>
            <Status.Available>
                <RequirementProjectWrapper service={service} />
            </Status.Available>
        </Status>
    );
};