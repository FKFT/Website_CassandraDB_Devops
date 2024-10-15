import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Nav from '../components/Nav'; // Adjust the import path as necessary
import axios from 'axios';

// Mock the axios module
jest.mock('axios');

describe('Nav Component', () => {
  const mockOnPostCreateClick = jest.fn();

  beforeEach(() => {
    // Clear any previous mocks
    jest.clearAllMocks();
    
    // Set up local storage mock
    localStorage.setItem('loggedInUser', JSON.stringify({ email: 'test@example.com', loggedin: true }));
  });

  test('renders Nav component with user info', async () => {
    // Mock API response for user fetching
    axios.get.mockResolvedValueOnce({
      data: [{ email: 'test@example.com', loggedin: true }],
    });

    await act(async () => {
      render(<Nav onPostCreateClick={mockOnPostCreateClick} />);
    });

    // Check if user name is displayed
    const userName = screen.getByText('Test'); // Ensure this matches how the user name is constructed in Nav.js
    expect(userName).toBeInTheDocument();

    // Check if the "Create a Post" button is rendered
    const createPostButton = screen.getByText(/Create a Post/i);
    expect(createPostButton).toBeInTheDocument();
  });

  test('calls onPostCreateClick when Create a Post button is clicked', () => {
    render(<Nav onPostCreateClick={mockOnPostCreateClick} />);

    const createPostButton = screen.getByText(/Create a Post/i);
    fireEvent.click(createPostButton);

    expect(mockOnPostCreateClick).toHaveBeenCalledTimes(1);
  });

  test('handles error when fetching users', async () => {
    // Mock API to simulate an error
    axios.get.mockRejectedValueOnce(new Error('Error fetching users'));

    await act(async () => {
      render(<Nav onPostCreateClick={mockOnPostCreateClick} />);
    });

    // Ensure it handles the error gracefully (consider adding an error state in Nav.js)
    // You may want to implement a state in your Nav.js to show an error message
  });
});
