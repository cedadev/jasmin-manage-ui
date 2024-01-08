import React from 'react';

import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { LinkContainer } from 'react-router-bootstrap';

import { Logo } from 'fwtheme-react-jasmin';

import { useCurrentUser } from '../api';


const ManageNavBar = () => {
    const currentUser = useCurrentUser();
    return (
        <Navbar expand="lg" variant="dark" bg="success">
            <LinkContainer to="/">
                <Navbar.Brand><Logo height={30} /></Navbar.Brand>
            </LinkContainer>
            <Navbar.Toggle />
            <Navbar.Collapse>
                <Nav className="mr-auto">
                    <LinkContainer to="/projects">
                        <Nav.Link>My Projects</Nav.Link>
                    </LinkContainer>
                    <LinkContainer to="/consortia">
                        <Nav.Link>Consortia</Nav.Link>
                    </LinkContainer>
                    <LinkContainer to="/tags">
                        <Nav.Link>Tags</Nav.Link>
                    </LinkContainer>
                </Nav>
                {currentUser.initialised && (
                    // If the user is being impersonated, set a UI hint to indicate that
                    currentUser.data.is_impersonated ? (
                        <Navbar.Text className="bg-danger px-2">
                            <i className="fas fa-fw fa-user-secret mr-1" />
                            {currentUser.data.username}
                        </Navbar.Text>
                    ) : (
                        <Navbar.Text>
                            <i className="fas fa-fw fa-user mr-1" />
                            {currentUser.data.username}
                        </Navbar.Text>
                    )
                )}
            </Navbar.Collapse>
        </Navbar>
    );
};


export default ManageNavBar;
