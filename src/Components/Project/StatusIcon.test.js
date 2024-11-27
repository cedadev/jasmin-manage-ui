import React from 'react';
import { render } from '@testing-library/react'
import {StatusIcon, StatusIconWithText} from './StatusIcon'

// Group together tests for the 'StatusIcon' component.
describe('StatusIcon Component', () => {

    //Check that it renders the 'APPROVED' icon correctly
    it('renders the correct icon for the approved status', () => {
        const { getByTitle} = render(<StatusIcon status="APPROVED" />);
        const icon = getByTitle('APPROVED');
        expect(icon).toHaveClass('fas fa-check');
    });

    //Check that it renders the 'REQUESTED' icon correctly
    it('renders the correct icon for the requested status', () => {
        const { getByTitle} = render(<StatusIcon status="REQUESTED" />);
        const icon = getByTitle('REQUESTED');
        expect(icon).toHaveClass('fas fa-paper-plane');
    });

    //Check that it renders the 'REJECTED' icon correctly
    it('renders the correct icon for the rejected status', () => {
        const { getByTitle} = render(<StatusIcon status="REJECTED" />);
        const icon = getByTitle('REJECTED');
        expect(icon).toHaveClass('fas fa-ban');
    });

    //Check that it renders the 'AWAITING_PROVISIONING' icon correctly
    it('renders the correct icon for the awaiting_provisioning status', () => {
        const { getByTitle} = render(<StatusIcon status="AWAITING_PROVISIONING" />);
        const icon = getByTitle('AWAITING_PROVISIONING');
        expect(icon).toHaveClass('fas fa-hourglass-half');
    });

    //Check that it renders the 'PROVISIONED' icon correctly
    it('renders the correct icon for the provisioned status', () => {
        const { getByTitle} = render(<StatusIcon status="PROVISIONED" />);
        const icon = getByTitle('PROVISIONED');
        expect(icon).toHaveClass('fas fa-layer-group');
    });

    //Check that it renders the 'DECOMMISSIONED' icon correctly
    it('renders the correct icon for the decommissioned status', () => {
        const { getByTitle} = render(<StatusIcon status="DECOMMISSIONED" />);
        const icon = getByTitle('DECOMMISSIONED');
        expect(icon).toHaveClass('fas fa-power-off');
    });

    //Check that it renders the unknown icon correctly
    it("doesn't render an icon for an unknown status" , () => { 
        const { container } = render(<StatusIcon status="UNKNOWN" />); 
        expect(container.firstChild).toBeNull;
    });

});

// Group together tests for the 'StatusIconWithText' component.
describe('StatusIconWithText Component', () => {

    //Check that it renders the 'APPROVED' icon and text correctly
    it('renders the correct text and icon for the APPROVED status', () => {
        const { getByText, getByTitle } = render(<StatusIconWithText status = "APPROVED" />);
        const text = getByText('APPROVED');
        expect(text).toHaveClass('text-success');
        const icon = getByTitle('APPROVED');
        expect(icon).toHaveClass('fas fa-check');
    })

    //Check that it renders the 'REJECTED' icon and text correctly
    it('renders the correct text and icon for the REJECTED status', () => {
        const { getByText, getByTitle } = render(<StatusIconWithText status = "REJECTED" />);
        const text = getByText('REJECTED');
        expect(text).toHaveClass('text-danger');
        const icon = getByTitle('REJECTED');
        expect(icon).toHaveClass('fas fa-ban');
    })

    //Check that it renders the 'AWAITING_PROVISIONING' icon and text correctly
    it('renders the correct text and icon for the AWAITING_PROVISIONING status', () => {
        const { getByText, getByTitle } = render(<StatusIconWithText status = "AWAITING_PROVISIONING" />);
        const text = getByText('AWAITING_PROVISIONING');
        expect(text).toHaveClass('text-warning');
        const icon = getByTitle('AWAITING_PROVISIONING');
        expect(icon).toHaveClass('fas fa-hourglass-half');
    })

    //Check that it renders the 'PROVISIONED' icon and text correctly
    it('renders the correct text and icon for the PROVISIONED status', () => {
        const { getByText, getByTitle } = render(<StatusIconWithText status = "PROVISIONED" />);
        const text = getByText('PROVISIONED');
        expect(text).toHaveClass('text-info');
        const icon = getByTitle('PROVISIONED');
        expect(icon).toHaveClass('fas fa-layer-group');
    })

    //Check that it renders the 'DECOMMISSIONED' icon and text correctly
    it('renders the correct text and icon for the DECOMMISSIONED status', () => {
        const { getByText, getByTitle } = render(<StatusIconWithText status = "DECOMMISSIONED" />);
        const text = getByText('DECOMMISSIONED');
        expect(text).toHaveClass('text-muted');
        const icon = getByTitle('DECOMMISSIONED');
        expect(icon).toHaveClass('fas fa-power-off');
    })
})