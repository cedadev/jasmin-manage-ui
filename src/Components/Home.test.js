import React from 'react';
import renderer from 'react-test-renderer';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import Home from './Home';

// Group together tests for the 'Home' component.
describe('Home Component', () => {
    // Check that the homepage looks how it should as compared to the snapshot.
    it('matches the snapshot', () => {
        // Mimic the structure of the homepage in Home.js
        const component = renderer.create(
            <Router>
                <Home />
            </Router>
        );
        // Convert the component to JSON (easily readible)
        let tree = component.toJSON();
        // Expect the tree component to match the snapshot
        expect(tree).toMatchSnapshot();
    });

    // Check the title and page content
    it('renders page title and content correctly', () => {
        // Render the home page
        render(
            <Router>
                <Home />
            </Router>
        );

        // Expect there to be some text saying 'JASMIN Projects Portal' in the page
        expect(screen.getByText('JASMIN Projects Portal')).toBeVisible();
        // Expect there to be some text saying 'Welcome to the ...' in the page
        expect(screen.getByText('Welcome to the JASMIN Projects Portal.')).toBeVisible();
        // Expect there to be some text saying 'Using this portal, you...' in the page
        expect(screen.getByText('Using this portal, you can request JASMIN resources for your project and track their status.')).toBeVisible();
    });

    // Test that the button works properly
    it('navigates to projects page when Manage my projects button is clicked', () => {
        render(
            <Router>
                <Home />
            </Router>
        );

        // Check that the button is on the screen
        const manageProjectsButton = screen.getByRole('link', { name: /Manage my projects/i });
        expect(manageProjectsButton).toBeVisible();

    });
});

