import React from 'react';

import { Link } from 'react-router-dom';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';

import { PageHeader } from 'fwtheme-react-jasmin';

import { Status, useEnsureRefreshed } from '../../rest-resource';

import { useCurrentUser, useConsortia } from '../../api';

import { SpinnerWithText, sortByKey } from '../utils';


const ConsortiumCard = ({ consortium }) => {
    const currentUser = useCurrentUser();

    const numProjects = consortium.data.num_projects;
    const numProjectsUser = consortium.data.num_projects_current_user;
    const userIsManager = consortium.data.manager.id === currentUser.data.id;
    const managerName = consortium.data.manager.last_name ?
        `${consortium.data.manager.first_name} ${consortium.data.manager.last_name}` :
        consortium.data.manager.username;

    return (
        <Card className="mb-3" style={{ borderWidth: '3px' }}>
            <Card.Header>
                <h5 className="mb-0">{consortium.data.name}</h5>
            </Card.Header>
            <ListGroup variant="flush" className="border-0">
                <ListGroup.Item>{consortium.data.description}</ListGroup.Item>
                {!consortium.data.is_public && (
                    <ListGroup.Item variant="danger">
                        This consortium is <strong>not public</strong>.
                    </ListGroup.Item>
                )}
                <ListGroup.Item>
                    Consortium has{" "}
                    <strong>{numProjects} project{numProjects !== 1  ? 's' : ''}</strong>.
                </ListGroup.Item>
                {numProjectsUser > 0 && (
                    <ListGroup.Item variant="warning">
                        You have{" "}
                        <strong>{numProjectsUser} project{numProjectsUser > 1 ? 's' : ''}</strong>{" "}
                        in this consortium.
                    </ListGroup.Item>
                )}
                <ListGroup.Item variant={userIsManager ? 'success' : undefined}>
                    {userIsManager ? (
                        <strong>You are the consortium manager.</strong>
                    ) : (<>
                        Manager is <strong>{managerName}</strong>.
                    </>)}
                </ListGroup.Item>
            </ListGroup>
            {userIsManager && (
                <Card.Footer className="text-right">
                    <Link to={`/consortia/${consortium.data.id}`}>
                        <Button variant="outline-primary">Go to consortium</Button>
                    </Link>
                </Card.Footer>
            )}
        </Card>
    );
};


export const ConsortiumList = () => {
    const currentUser = useCurrentUser();
    const consortia = useConsortia();

    // Make sure the consortia are refreshed each time
    const refreshedConsortia = useEnsureRefreshed(consortia);

    return (<>
        <PageHeader>Consortia</PageHeader>
        <Status fetchable={refreshedConsortia}>
            <Status.Loading>
                <div className="d-flex justify-content-center my-5">
                    <SpinnerWithText iconSize="lg" textSize="120%">
                        Loading consortia...
                    </SpinnerWithText>
                </div>
            </Status.Loading>
            <Status.Unavailable>
                <Alert variant="danger">Unable to load consortia.</Alert>
            </Status.Unavailable>
            <Status.Available>
                {data => {
                    // Sort the consortia so that the ones that the user manages appear first
                    const sortedConsortia = sortByKey(
                        Object.values(data),
                        c => [currentUser.data.id !== c.data.manager.id, c.data.name]
                    );
                    return (
                        <Row xs={1} sm={2} lg={3}>
                            {sortedConsortia.map(c =>
                                <Col key={c.data.id}><ConsortiumCard consortium={c} /></Col>
                            )}
                        </Row>
                    );
                }}
            </Status.Available>
        </Status>
    </>);
};
