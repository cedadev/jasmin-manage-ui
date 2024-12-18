// src/Components/Consortium/List.test.js

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

const renderPage = () => {
  return render(
    <Router>
      <ConsortiumList />
    </Router>
  );
};

describe("ConsortiumList Component", () => {
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

  const mockCurrentUser = {
    data: {
      id: 1,
      first_name: "Alice",
      last_name: "Smith",
      username: "alice",
    },
  };

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("matches the snapshot", () => {
    const component = renderer.create(
      <Router>
        <ConsortiumList />
      </Router>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("renders loading state", () => {
    useConsortia.mockReturnValue({
      initialised: false,
      fetching: true,
      markDirty: jest.fn(),
    });
    renderPage();

    expect(screen.getByText("Loading consortia...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    useConsortia.mockReturnValue({
      data: null,
      initialised: false,
      fetching: false,
      fetchError: new Error("Failed to load consortia"),
    });

    renderPage();

    expect(screen.getByText("Unable to load consortia.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("alert-danger");
  });

  it("renders consortia list", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Consortia")).toBeInTheDocument();
    });

    const consortiumAHeader = screen.getByText("Consortium A");
    const consortiumACard = consortiumAHeader.closest(".card");
    const consortiumBHeader = screen.getByText("Consortium B");
    const consortiumBCard = consortiumBHeader.closest(".card");

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

  it("renders manager's username when last name is not available", () => {
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

    expect(screen.getByText(/Manager is/)).toBeInTheDocument();
    expect(screen.getByText(/manageruser/)).toBeInTheDocument();
  });
});
