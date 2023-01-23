
import React from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Jumbotron from 'react-bootstrap/Jumbotron';

const NotFound = () => (
    <Row>
        <Col>
            <Jumbotron>
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
            </Jumbotron>
        </Col>
    </Row>
);

export default NotFound;



// class NotFoundPage extends React.Component{
//     render(){
//         return (
//             <div>
//                 <div style={{class:"alert alert-with-icon alert-warning", role:"alert"}}>
//                     <i style={{class:"fas fa-exclamation-circle"}}></i> <span>The page you are looking for does not exist</span>
//                 </div>
//                 <p>The page you requested does not exist on this server.</p>

//                 <p>
//                     You could try <Link to="/">returning to homepage</Link> or 
//                     <Link to="/projects">looking at your projects</Link>.
//                 </p>
//             </div>
//         );
//     }
// }

// export default NotFoundPage;