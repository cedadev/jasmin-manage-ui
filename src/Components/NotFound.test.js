import React from 'react';
import { render } from '@testing-library/react';
import NotFound from './NotFound';

// Test that the NotFound page renders correctly
it('Renders the page correctly', () => {
    const { getByText, getByRole } = render(<NotFound />);

    const mainHeading = getByText('Page Not Found');
    const alertIcon = getByRole('alert', {name: ''});
    const alertMessage = getByText(/The page you are looking for does not exist/i);

    // Check that the heading, alert icon and alert message are in the page
    expect(mainHeading).toBeInTheDocument();
    expect(alertIcon).toBeInTheDocument();
    expect(alertMessage).toBeInTheDocument();
})
