import React from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const NotFound = () => (
    <Row>
        <Col>
            <div className="Jumbotron">
                <h1>Page Not Found</h1>
                <div class="alert alert-with-icon alert-warning" role="alert">
                    <i class="fas fa-exclamation-circle"></i> <span>The page you are looking for does not exist</span>
                </div>
                <p>The page you requested does not exist on this server.</p>
                <p>
                    You could try returning to the 
                    <a href="/"> homepage </a>, viewing your 
                    <a href="/projects"> projects</a> or looking at
                    <a href="/consortia"> consortia</a>.
                </p>
            </div>
        </Col>
    </Row>
);

export default NotFound;