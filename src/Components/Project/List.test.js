import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import TestRenderer from "react-test-renderer";
import { BrowserRouter as Router } from "react-router-dom";
import ProjectList from "./List";
import { useProjects, useCurrentUser, useConsortia, useTags } from "../../api";
import { useNestedResource } from "../../rest-resource";

// Mock fetch globally
global.fetch = jest.fn();

// Mock all required hooks
jest.mock("../../api", () => ({
  useProjects: jest.fn(),
  useCurrentUser: jest.fn(),
  useConsortia: jest.fn(),
  useTags: jest.fn(),
}));

// Mock the rest-resource hooks
jest.mock("../../rest-resource", () => ({
  ...jest.requireActual("../../rest-resource"),
  useNestedResource: jest.fn(),
  useStatusContext: () => ({
    initialised: true,
    fetchError: null,
    data: {},
  }),
}));

const MockStatus = ({ children }) => <div>{children}</div>;

MockStatus.Loading = ({ children }) => <div>{children}</div>;
MockStatus.Available = ({ children }) => <div>{children}</div>;
MockStatus.Unavailable = ({ children }) => <div>{children}</div>;

// Mock data for projects
const mockProjects = {
  data: {
    1: {
      data: {
        id: 1,
        name: "Project A",
        status: "UNDER_REVIEW",
        num_services: 2,
        num_requirements: 3,
        num_collaborators: 2,
        created_at: "2023-01-01",
        consortium: 1,
      },
    },
    2: {
      data: {
        id: 2,
        name: "Project B",
        status: "EDITABLE",
        num_services: 1,
        num_requirements: 1,
        num_collaborators: 1,
        created_at: "2023-01-02",
        consortium: 2,
      },
    },
  },
  initialised: true,
  fetching: false,
  fetchError: null,
};

// Helper function to render the page
const renderPage = () => {
  return render(
    <Router>
      <ProjectList />
    </Router>
  );
};

describe("ProjectList Component", () => {
  beforeEach(() => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
      status: 200,
    });
    // Mock the hook returns
    useProjects.mockReturnValue(mockProjects);
    useNestedResource.mockReturnValue({
      data: {},
      initialised: true,
      fetching: false,
    });
    useCurrentUser.mockReturnValue({
      data: {
        id: 1,
        username: "testuser",
      },
      initialised: true,
    });
    useConsortia.mockReturnValue({
      data: {
        1: {
          data: {
            id: 1,
            name: "Consortium A",
            manager: { id: 1 },
          },
        },
        2: {
          data: {
            id: 2,
            name: "Consortium B",
            manager: { id: 2 },
          },
        },
      },
      initialised: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should match the snapshot", async () => {
    let tree;
    await TestRenderer.act(async () => {
      tree = TestRenderer.create(
        <Router>
          <ProjectList />
        </Router>
      );
    });

    expect(tree.toJSON()).toMatchSnapshot();
  });

  it("Should render the loading state", async () => {
    useProjects.mockReturnValue({
      initialised: false,
      fetching: true,
    });

    await act(async () => {
      renderPage();
    });

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  it("Should render the error state", async () => {
    useProjects.mockReturnValue({
      data: null,
      initialised: false,
      fetching: false,
      fetchError: new Error("Failed to load projects"),
    });

    await act(async () => {
      renderPage();
    });

    expect(screen.getByText("Unable to load projects.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("alert-danger");
  });

  it("Should render the projects list", async () => {
    await act(async () => {
      renderPage();
    });

    await waitFor(() => {
      expect(screen.getByText("My Projects")).toBeInTheDocument();
    });

    // Get the project cards
    const projectAHeader = screen.getByText("Project A");
    const projectACard = projectAHeader.closest(".card");
    const projectBHeader = screen.getByText("Project B");
    const projectBCard = projectBHeader.closest(".card");

    // Check Project A content
    const withinProjectA = within(projectACard);
    expect(withinProjectA.getByText(/Project is/)).toBeInTheDocument();
    expect(withinProjectA.getByText(/UNDER_REVIEW/)).toBeInTheDocument();
    expect(withinProjectA.getByText(/3 requirements/)).toBeInTheDocument();
    expect(withinProjectA.getByText(/2 services/)).toBeInTheDocument();
    expect(withinProjectA.getByText("Go to project")).toBeInTheDocument();

    // Check Project B content
    const withinProjectB = within(projectBCard);
    expect(withinProjectB.getByText(/Project is/)).toBeInTheDocument();
    expect(withinProjectB.getByText(/EDITABLE/)).toBeInTheDocument();
    expect(withinProjectB.getByText(/1 requirement/)).toBeInTheDocument();
    expect(withinProjectB.getByText(/1 service/)).toBeInTheDocument();
    expect(withinProjectB.getByText("Go to project")).toBeInTheDocument();
  });
});
