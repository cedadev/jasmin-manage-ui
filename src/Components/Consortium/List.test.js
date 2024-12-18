import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import renderer from "react-test-renderer";

import ConsortiumList from "./List";
import { useCurrentUser, useConsortia } from "../../api";
import { BrowserRouter as Router } from "react-router-dom";
import { useEnsureRefreshed } from "../../rest-resource";

// Mock the API hooks
jest.mock("../../api");

// Mock the useEnsureRefreshed hook
jest.mock("../../rest-resource", () => ({
  ...jest.requireActual("../../rest-resource"),
  useEnsureRefreshed: jest.fn(),
}));

// Helper function to render the page
const renderPage = () => {
  return render(
    <Router>
      <ConsortiumList />
    </Router>
  );
};

describe("ConsortiumList Component", () => {
  // Mock data for consortia
  const mockConsortia = [
    {
      data: {
        id: 1,
        name: "Consortium A",
        description: "Description A",
        is_public: true,
        num_projects: 5,
        num_projects_current_user: 2,
        manager: {
          id: 1,
          first_name: "Alice",
          last_name: "Smith",
          username: "alice",
        },
      },
    },
    {
      data: {
        id: 2,
        name: "Consortium B",
        description: "Description B",
        is_public: false,
        num_projects: 1,
        num_projects_current_user: 0,
        manager: {
          id: 2,
          first_name: "Bob",
          last_name: "Jones",
          username: "bob",
        },
      },
    },
  ];

  // Mock data for the current user
  const mockCurrentUser = {
    data: {
      id: 1,
      first_name: "Alice",
      last_name: "Smith",
      username: "alice",
    },
  };

  // Set up mocks before each test
  beforeEach(() => {
    useCurrentUser.mockReturnValue(mockCurrentUser);
    useConsortia.mockReturnValue({
      data: {
        1: mockConsortia[0],
        2: mockConsortia[1],
      },
      initialised: true,
      fetching: false,
      fetchError: null,
      markDirty: jest.fn(),
    });

    useEnsureRefreshed.mockImplementation((consortia) => consortia);
  });

  // Clear mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test to match the snapshot
  it("Should match the snapshot", () => {
    const component = renderer.create(
      <Router>
        <ConsortiumList />
      </Router>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  // Test to render the loading state
  it("Should render the loading state", () => {
    useConsortia.mockReturnValue({
      initialised: false,
      fetching: true,
      markDirty: jest.fn(),
    });
    renderPage();

    expect(screen.getByText("Loading consortia...")).toBeInTheDocument();
  });

  // Test to render the error state
  it("Should render the error state", () => {
    useConsortia.mockReturnValue({
      data: null,
      initialised: false,
      fetching: false,
      fetchError: new Error("Failed to load consortia"),
    });

    renderPage();

    // Check if the error message is displayed
    expect(screen.getByText("Unable to load consortia.")).toBeInTheDocument();
    // Check if the alert has the correct class
    expect(screen.getByRole("alert")).toHaveClass("alert-danger");
  });

  // Test to render the consortia list
  it("Should render the consortia list", async () => {
    renderPage();

    await waitFor(() => {
      // Check if the consortia title is displayed
      expect(screen.getByText("Consortia")).toBeInTheDocument();
    });

    // Get the consortium A card
    const consortiumAHeader = screen.getByText("Consortium A");
    const consortiumACard = consortiumAHeader.closest(".card");
    // Get the consortium B card
    const consortiumBHeader = screen.getByText("Consortium B");
    const consortiumBCard = consortiumBHeader.closest(".card");

    // Check the contents of consortium A card
    const withinConsortiumA = within(consortiumACard);
    expect(withinConsortiumA.getByText("Description A")).toBeInTheDocument();
    expect(withinConsortiumA.getByText(/Consortium has/)).toBeInTheDocument();
    expect(withinConsortiumA.getByText(/5 projects/)).toBeInTheDocument();
    expect(withinConsortiumA.getByText(/You have/)).toBeInTheDocument();
    expect(withinConsortiumA.getByText(/2 projects/)).toBeInTheDocument();
    expect(
      withinConsortiumA.getByText(/in this consortium./)
    ).toBeInTheDocument();
    expect(
      withinConsortiumA.getByText("You are the consortium manager.")
    ).toBeInTheDocument();
    expect(withinConsortiumA.getByText("Go to consortium")).toBeInTheDocument();

    // Check the contents of consortium B card
    const withinConsortiumB = within(consortiumBCard);
    expect(withinConsortiumB.getByText("Description B")).toBeInTheDocument();
    expect(
      withinConsortiumB.getByText(/This consortium is/)
    ).toBeInTheDocument();
    expect(withinConsortiumB.getByText(/not public/)).toBeInTheDocument();
    expect(withinConsortiumB.getByText(/Consortium has/)).toBeInTheDocument();
    expect(withinConsortiumB.getByText(/1 project/)).toBeInTheDocument();
    expect(withinConsortiumB.getByText(/Manager is/)).toBeInTheDocument();
    expect(withinConsortiumB.getByText(/Bob Jones/)).toBeInTheDocument();
  });

  // Test to render the manager's username when last name is not available
  it("Should render the manager's username when last name is not available", () => {
    useCurrentUser.mockReturnValue({
      data: {
        id: 2,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
      },
      fetching: false,
      fetchError: null,
      initialised: true,
    });

    useConsortia.mockReturnValue({
      data: {
        1: {
          data: {
            id: 1,
            name: "Consortium 2",
            description: "Description 2",
            num_projects: 2,
            num_projects_current_user: 1,
            manager: {
              id: 1,
              username: "manageruser",
              first_name: "",
              last_name: null,
            },
            is_public: true,
          },
        },
      },
      initialised: true,
      fetching: false,
      fetchError: null,
    });

    renderPage();

    // Check if the manager's username is displayed
    expect(screen.getByText(/Manager is/)).toBeInTheDocument();
    expect(screen.getByText(/manageruser/)).toBeInTheDocument();
  });
});
