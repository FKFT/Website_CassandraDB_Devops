import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../components/Login'; // Adjust the import path as needed
import axios from 'axios';

// Mock the axios module
jest.mock('axios');

jest.mock('../../../opswerks-hub-backend/server.js', () => ({
    getUsersFromDB: jest.fn(),
  }));

const mockUserData = [
    { id: 1, email: 'test@example.com', password: 'password123' },
    // Add more users as needed
  ];

describe('LoginPage Component', () => {
  beforeEach(() => {
    // Reset the mock before each test
    jest.clearAllMocks();
    axios.get.mockResolvedValueOnce({ data: mockUserData }); // mockUserData should be defined with your mock data structure
  });

  
  test('renders the login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows user to type email and password', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('simulates a successful login with valid credentials', async () => {
    axios.post.mockResolvedValueOnce({ data: { token: 'fake-token' } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
    });

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    expect(loggedInUser).toEqual({ id: 1, email: 'test@example.com', password: 'password123', loggedin: true });
  });
});
