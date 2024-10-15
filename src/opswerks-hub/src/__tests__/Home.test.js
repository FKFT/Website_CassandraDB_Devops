import React from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import Home from '../components/Home'; // Ensure this points to your actual file location
import '@testing-library/jest-dom'; // For better assertions like "toBeInTheDocument"
import config from '../components/Config';

jest.mock('axios'); // Mock axios for API calls

const mockLikedPosts = [
  { id: 1, title: "Liked Post 1", content: "Content of liked post 1" },
  { id: 2, title: "Liked Post 2", content: "Content of liked post 2" },
];

// Define mockPosts data for testing
const mockPosts = [
  { id: 1, title: "First Post", content: "Content of the first post." },
  { id: 2, title: "Second Post", content: "Content of the second post." },
];

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('loggedInUser', JSON.stringify({ loggedin: true, email: 'test@example.com' }));

    // Mock response for users
    axios.get.mockImplementation((url) => {
      if (url === `${config.apiBaseUrl}/api/data/users`) {
        return Promise.resolve({ data: [{ id: 1, email: 'user@example.com' }] }); // Mock user data
      }
      // Mock other axios calls as needed
      if (url === `${config.apiBaseUrl}/api/data/likedPosts`) {
        return Promise.resolve({ data: mockLikedPosts }); // Ensure mockLikedPosts is defined
      }
      if (url === `${config.apiBaseUrl}/api/data/posts`) {
        return Promise.resolve({ data: mockPosts }); // Ensure you have mockPosts defined
      }
      return Promise.reject(new Error("Not Found")); // Handle unexpected URLs
    });

    axios.post.mockImplementation((url) => {
      if (url === `${config.apiBaseUrl}/api/data/likePost`) {
        return Promise.resolve({ status: 200 }); // Mock a successful response
      }
      return Promise.reject(new Error("Not Found")); // Handle unexpected URLs
    });
  });

  test('fetches and displays posts', async () => {
    await act(async () => { // Wrapped render in act
      render(<Home />);
    });
    await waitFor(() => {
      expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
    });
  });

  test('opens and closes the PostCreate overlay', async () => {
    await act(async () => {
      render(<Home />);
    });
  
    // Click the button to open the PostCreate overlay
    const createPostButton = screen.getByRole('button', { name: /create a post/i });
    fireEvent.click(createPostButton);
  
    // Check that the PostCreate overlay is open
    const overlayTitle = await screen.findByText(/create a new post/i); // use findByText for async
    expect(overlayTitle).toBeInTheDocument();
  
    // Click the cancel button to close the overlay
    fireEvent.click(screen.getByText(/cancel/i));
  
    // Wait for the overlay to be closed
    await waitFor(() => {
      expect(screen.queryByText(/create a new post/i)).not.toBeInTheDocument();
    });
  });
  
});
