import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import Home from './Home'; // Ensure this points to your actual file location
import '@testing-library/jest-dom'; // For better assertions like "toBeInTheDocument"
import config from './Config';

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

  test('renders without crashing', async () => {
    await act(async () => { // Wrapped render in act
      render(<Home />);
    });

    screen.debug();

    expect(screen.getByText(/create a new post/i)).toBeInTheDocument();
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
    await act(async () => { // Wrapped render in act
      render(<Home />);
    });
    fireEvent.click(screen.getByText(/create a new post/i));
    expect(screen.getByText(/create a new post/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/cancel/i));
    await waitFor(() => {
      expect(screen.queryByText(/create a new post/i)).not.toBeInTheDocument();
    });
  });

  test('toggles like for a post', async () => {
    await act(async () => { 
      render(<Home />);
    });
  
    // Wait for the posts to load
    await waitFor(() => {
      expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
    });
  
    // Ensure the like button is present
    const likeButton = await screen.findByText(/like/i);
    expect(likeButton).toBeInTheDocument(); // Check if the button exists
  
    fireEvent.click(likeButton); // Click the like button
  
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(`${config.apiBaseUrl}/api/data/likePost`, { postId: mockPosts[0].id });
    });
  
    // Check if the UI updates if you have some state reflecting the like count or status
    expect(likeButton).toHaveTextContent(/liked/i); // Adjust this according to your implementation
  }); 

  test('renders without crashing and opens the PostCreate overlay', async () => {
    await act(async () => {
      render(<Home />);
    });
  
    // Use waitFor to ensure we wait for the text to be rendered
    await waitFor(() => {
      expect(screen.getByText(/create a new post/i)).toBeInTheDocument();
    });
  
    // Now that the button is confirmed to be in the document, we can click it
    fireEvent.click(screen.getByText(/create a new post/i));
  
    // Assuming clicking opens the overlay, check for its presence
    expect(screen.getByText(/some text in the overlay/i)).toBeInTheDocument(); // Adjust according to your overlay content
  });
  
});
