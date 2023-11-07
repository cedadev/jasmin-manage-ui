import React from 'react';

import { Link } from 'react-router-dom';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';

import classNames from 'classnames';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status } from '../../rest-resource';

import { useProjects } from '../../api';

import { sortByKey, SpinnerWithText } from '../utils';

import {
    ProjectStatusListItem,
    ProjectConsortiumListItem,
    ProjectCollaboratorsListItem,
    ProjectCreatedAtListItem
} from './CardItems';

import { ProjectCreateButton } from './ProjectCreateButton';
import { ProjectJoinButton } from './ProjectJoinButton';


const ProjectCard = ({ project }) => {
    const numServices = project.data.num_services || 0;
    const numRequirements = project.data.num_requirements || 0;
    return (
        <Card
            className={classNames("mb-3", { "text-muted": project.data.status === "COMPLETED" })}
            style={{ borderWidth: '3px' }}
        >
            <Card.Header>
                <h5 className="mb-0">{project.data.name}</h5>
            </Card.Header>
            <ListGroup variant="flush" className="border-0">
                <ProjectStatusListItem project={project} />
                <ProjectConsortiumListItem project={project} />
                <ListGroup.Item>
                    Project has{" "}
                    <strong>{numRequirements} requirement{numRequirements !== 1  ? 's' : ''}</strong> in{" "}
                    <strong>{numServices} service{numServices !== 1  ? 's' : ''}</strong>.
                </ListGroup.Item>
                <ProjectCollaboratorsListItem project={project} />
                <ProjectCreatedAtListItem project={project} />
            </ListGroup>
            <Card.Footer className="text-right">
                {/* Pass the project data as state */}
                <Link to={{
                    pathname: `/projects/${project.data.id}`,
                    state: { initialData: project.data }
                }}>
                    <Button variant="outline-primary">Go to project</Button>
                </Link>
            </Card.Footer>
        </Card>
    );
};


export const ProjectList = () => {
    const projects = useProjects();

    return (<>
        <PageHeader>My Projects</PageHeader>
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
                {data => (
                    <Row xs={1} sm={2} lg={3}>
                        {sortByKey(Object.values(data), p => p.data.name).map(p =>
                            <Col key={p.data.id}><ProjectCard project={p} /></Col>
                        )}
                        <Col>
                            <Card className="text-center mb-3" body>
                                <ButtonGroup vertical>
                                    <ProjectCreateButton projects={projects} />
                                    <ProjectJoinButton />
                                </ButtonGroup>
                            </Card>
                        </Col>
                    </Row>
                )}
            </Status.Available>
        </Status>
    </>);
};

