
import React from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Jumbotron from 'react-bootstrap/Jumbotron';

const Forbidden = () => (
    <Row>
        <Col>
            <Jumbotron>
                <h1>Permission denied</h1>
                <div className="alert alert-with-icon alert-warning" role="alert">
                    <i className="fas fa-exclamation-circle"></i> <span>You do not have permission to access this page.</span>
                </div>
                <p>
                    You could try returning to the 
                    <a href="/"> homepage </a>, viewing your 
                    <a href="/projects"> projects</a> or looking at
                    <a href="/consortia"> consortia</a>.
                </p>
            </Jumbotron>
        </Col>
    </Row>
);

export default Forbidden;