import React from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import { LinkContainer } from 'react-router-bootstrap';


const Home = () => (
    <Row>
        <Col>
            <div className="jumbotron">
                <h1>JASMIN Projects Portal</h1>
                <p>Welcome to the JASMIN Projects Portal.</p>
                <p>Using this portal, you can request JASMIN resources for your project and track their status.</p>
                <LinkContainer to="/projects">
                    <Button variant="primary" size="lg">Manage my projects</Button>
                </LinkContainer>
            </div>
        </Col>
    </Row>
);

export default Home;
