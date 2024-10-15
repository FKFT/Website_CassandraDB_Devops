import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostComment from '../components/PostComment'; // Adjust the import based on your folder structure
import axios from 'axios';

// Mock the axios module
jest.mock('axios');

// Mock post data
const mockPost = {
  id: '1',
  username: 'testuser@example.com',
  title: 'Test Post',
  content: 'This is a test post.',
  comments: [],
};

// Mock functions
const mockFetchComments = jest.fn();
const mockToggleLike = jest.fn();
const mockOnClose = jest.fn();

describe('PostComment Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetchComments function to return comments
    mockFetchComments.mockResolvedValue([
      { Username: 'user1@example.com', Content: 'This is a comment', date: '2024-10-12T12:34:56' },
      { Username: 'user2@example.com', Content: 'Another comment', date: '2024-10-13T14:22:31' },
    ]);

    // Mock response for liked posts
    axios.get.mockResolvedValue({
      data: [
        { email: 'testuser@example.com', postid: '1' }, // Simulate that the user liked the post
      ],
    });

    // Mock response for put request
    axios.put.mockResolvedValue({ status: 200 });

    // Ensure localStorage is set up
    const mockUser = JSON.stringify({ email: 'testuser@example.com' });
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => mockUser),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(
        <PostComment
          post={mockPost}
          toggleLike={mockToggleLike}
          onClose={mockOnClose}
          newPost={false}
          fetchComments={mockFetchComments}
        />
      );
    });

    expect(screen.getByText(mockPost.username)).toBeInTheDocument();
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    expect(screen.getByText(mockPost.content)).toBeInTheDocument();
  });

  it('toggles like on button click', async () => {
    await act(async () => {
      render(
        <PostComment
          post={mockPost}
          toggleLike={mockToggleLike}
          onClose={mockOnClose}
          newPost={false}
          fetchComments={mockFetchComments}
        />
      );
    });

    const likeButton = screen.getByText('Like');

    await act(async () => {
      fireEvent.click(likeButton);
    });

    expect(mockToggleLike).toHaveBeenCalledWith(mockPost.id);
  });

  it('fetches and displays comments', async () => {
    await act(async () => {
      render(
        <PostComment
          post={mockPost}
          toggleLike={mockToggleLike}
          onClose={mockOnClose}
          newPost={false}
          fetchComments={mockFetchComments}
        />
      );
    });

    await waitFor(() => {
      // Check if the comments are displayed correctly
      expect(screen.getByText('This is a comment')).toBeInTheDocument();
      expect(screen.getByText('Another comment')).toBeInTheDocument();
    });
  });
});
