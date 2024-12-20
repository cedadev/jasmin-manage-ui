import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { InvitationsListItems } from './InvitationsListItems';
import { useProjectPermissions } from './actions';
import moment from 'moment';


// Mock the dependencies - we don't want to use the real packages
jest.mock('moment', () => () => ({
    fromNow: jest.fn(() => 'a few seconds ago'),
}));
jest.mock('./actions', () => ({
    useProjectPermissions: jest.fn(),
}));
jest.mock('react-bootstrap-notify', () => ({
    useNotifications: jest.fn(() => jest.fn()),
}));

// Test InvitationsListItems
describe('InvitationsListItems', () => {
    // Make some mock data for project and invitations
    const project = { id: 1, name: 'Test Project' };
    const invitations = {
        data: {
            1: { data: { id: 1, email: 'test1@example.com', created_at: new Date().toISOString() } },
            2: { data: { id: 2, email: 'test2@example.com', created_at: new Date().toISOString() } },
        },
    };

    // Reset the state of all mocks e.g. call counts, return values
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //  Check that a list of invitations is returned
    it('renders a list of invitations', () => {
        useProjectPermissions.mockReturnValue({ canEditCollaborators: true });

        // Render the InvitationsListItems component
        render(<InvitationsListItems project={project} invitations={invitations} />);

        // Check that the email addresses are in the page
        expect(screen.getByText('test1@example.com')).toBeInTheDocument();
        expect(screen.getByText('test2@example.com')).toBeInTheDocument();
        // Check that 'a few seconds ago' is in the page
        expect(screen.getAllByText((content, element) => {
            return element.tagName.toLowerCase() === 'small' && content.includes('a few seconds ago');
        })).toHaveLength(2);
    });

    // Check that the user can see the invite form if they have the right permissions
    it('shows the invite form if user can edit collaborators', () => {
        useProjectPermissions.mockReturnValue({ canEditCollaborators: true });

        //  Render the InvitationsListItems component
        render(<InvitationsListItems project={project} invitations={invitations} />);

        // Check that the text 'Invite a new collaborator' is on the screen
        expect(screen.getByText('Invite a new collaborator')).toBeInTheDocument();
        // Check that there is some placeholder text saying 'email'
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    // Check that users without permission can't see the invite form
    it('does not show the invite form if user cannot edit collaborators', () => {
        useProjectPermissions.mockReturnValue({ canEditCollaborators: false });

        // Render the InvitationsListItems component
        render(<InvitationsListItems project={project} invitations={invitations} />);

        // 'Invite a new collaborator' shouldn't be on the page
        expect(screen.queryByText('Invite a new collaborator')).not.toBeInTheDocument();
    });

    // Check that the deletion modal works
    it('handles the deletion of an invitation', async () => {
        useProjectPermissions.mockReturnValue({ canEditCollaborators: true });

        // Render the InvitationsListItems component
        render(<InvitationsListItems project={project} invitations={invitations} />);

        // Check that there are two buttons saying 'Delete'
        const revokeButtons = screen.getAllByRole('button', {name: /Delete/i });
        expect(revokeButtons).toHaveLength(2);

        // Simulate a click on one of the delete buttons
        fireEvent.click(revokeButtons[0]);

        // This should cause the 'Revoke invitation' text to appear on the page
        expect(screen.getByText('Revoke invitation')).toBeInTheDocument();

        // Check if the dialog box contains text about revoking the invitation
        const modal = await screen.findByRole('dialog');
        const modalBody = within(modal).getByText(/Are you sure you want to revoke the invitation for/i);
        expect(modalBody).toBeInTheDocument();

        // Check if email is also present
        const email = within(modal).getByText('test1@example.com');
        expect(email).toBeInTheDocument();

    });
});