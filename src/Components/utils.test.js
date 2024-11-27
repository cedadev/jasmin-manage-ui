import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownEditor } from './utils';

//  Test for the MarkdownEditor component
describe('MarkdownEditor component', () => {
    // Check that the MarkdownEditor renders with the empty string prop simulating the default state
    it('renders with default prop', () => {
        const { getByText } = render(<MarkdownEditor value="" />);
        // There should be 'write' and 'preview' on the page
        expect(getByText("Write")).toBeVisible();
        expect(getByText("Preview")).toBeVisible();
    })
})