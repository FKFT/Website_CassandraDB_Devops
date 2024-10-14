// web/src/frontend/src/components/PostCreate.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'
import PostCreate from './CreatePost';
import axios from 'axios';

jest.mock('axios'); // Mock axios to prevent actual API calls

describe('PostCreate Component', () => {
    const mockOnPostCreated = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
        // Mocking localStorage
        const mockUser = { email: 'alice@example.com' };
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockUser));
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });

    test('renders correctly and allows input', () => {
        render(<PostCreate onPostCreated={mockOnPostCreated} onClose={mockOnClose} />);

        // Check for the title input and content textarea
        expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Content')).toBeInTheDocument();
    });

    test('shows alert if title or content is missing', () => {
        render(<PostCreate onPostCreated={mockOnPostCreated} onClose={mockOnClose} />);

        // Mock window.alert
        window.alert = jest.fn();

        // Try to submit the post with empty fields
        fireEvent.click(screen.getByText('Create Post'));
        
        expect(window.alert).toHaveBeenCalledWith('Please fill out both the title and content fields.');
    });

    test('submits post when title and content are provided', async () => {
        render(<PostCreate onPostCreated={mockOnPostCreated} onClose={mockOnClose} />);

        // Fill in the title and content
        fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'My Post Title' } });
        fireEvent.change(screen.getByPlaceholderText('Content'), { target: { value: 'This is the content of the post.' } });

        // Mock the API response
        axios.post.mockResolvedValue({ data: {} });

        // Submit the form
        fireEvent.click(screen.getByText('Create Post'));

        // Verify that onPostCreated is called
        await waitFor(() => 
            expect(mockOnPostCreated).toHaveBeenCalledWith({
                id: expect.any(Number), // Use expect.any to ignore specific values
                username: 'alice', // Derived from email
                title: 'My Post Title',
                content: 'This is the content of the post.',
                like: 0,
                comments: [],
            })
        );

        // Check if the form clears (title and content are reset)
        expect(screen.getByPlaceholderText('Title').value).toBe('');
        expect(screen.getByPlaceholderText('Content').value).toBe('');
    });

    test('calls onClose when Cancel button is clicked', () => {
        render(<PostCreate onPostCreated={mockOnPostCreated} onClose={mockOnClose} />);
        
        // Click the Cancel button
        fireEvent.click(screen.getByText('Cancel'));

        // Verify that onClose is called
        expect(mockOnClose).toHaveBeenCalled();
    });
});
