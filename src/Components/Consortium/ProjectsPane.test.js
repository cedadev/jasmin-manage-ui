import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import renderer from "react-test-renderer";
import { BrowserRouter as Router } from "react-router-dom";

import ProjectsPane from "./ProjectsPane";
import { useNestedResource } from "../../rest-resource";
import { useCurrentUser } from "../../api";

// Mock both the rest-resource and api hooks
jest.mock("../../rest-resource", () => ({
  ...jest.requireActual("../../rest-resource"),
  useNestedResource: jest.fn(),
}));

jest.mock("../../api", () => ({
  useCurrentUser: jest.fn(),
}));

// Helper function to render the component
const renderProjectsPane = (projects) => {
  return render(
    <Router>
      <ProjectsPane projects={projects} />
    </Router>
  );
};

describe("ProjectsPane Component", () => {
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
        },
      },
    },
    initialised: true,
    fetching: false,
    fetchError: null,
  };

  beforeEach(() => {
    // Mock current user
    useCurrentUser.mockReturnValue({
      data: {
        id: 1,
        username: "testuser",
        first_name: "Test",
        last_name: "User",
      },
    });

    // Mock tags and collaborators data
    useNestedResource.mockImplementation((project, resourceType) => {
      if (resourceType === "tags") {
        return {
          data: {
            1: { data: { name: "Tag1" } },
            2: { data: { name: "Tag2" } },
          },
          initialised: true,
          fetching: false,
        };
      }
      if (resourceType === "collaborators") {
        return {
          data: {
            1: {
              data: {
                id: 1,
                user: {
                  id: 1,
                  username: "testuser",
                  first_name: "Test",
                  last_name: "User",
                },
                role: "OWNER",
              },
            },
          },
          initialised: true,
          fetching: false,
        };
      }
      return {
        data: {},
        initialised: true,
        fetching: false,
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should match the snapshot", () => {
    const component = renderer.create(
      <Router>
        <ProjectsPane projects={mockProjects} />
      </Router>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("Should display loading state when fetching", () => {
    const loadingProjects = {
      ...mockProjects,
      initialised: false,
      fetching: true,
    };

    renderProjectsPane(loadingProjects);
    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  it("Should render project cards with correct information", async () => {
    renderProjectsPane(mockProjects);

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
    });

    // Get the project cards
    const projectAHeader = screen.getByText("Project A");
    const projectACard = projectAHeader.closest(".card");
    const projectBHeader = screen.getByText("Project B");
    const projectBCard = projectBHeader.closest(".card");

    // Check Project A content
    const withinProjectA = within(projectACard);
    expect(withinProjectA.getByText(/UNDER_REVIEW/)).toBeInTheDocument();
    expect(withinProjectA.getByText(/3 requirements/)).toBeInTheDocument();
    expect(withinProjectA.getByText(/2 services/)).toBeInTheDocument();
    expect(withinProjectA.getByText("Go to project")).toBeInTheDocument();

    // Check Project B content
    const withinProjectB = within(projectBCard);
    expect(withinProjectB.getByText(/EDITABLE/)).toBeInTheDocument();
    expect(withinProjectB.getByText(/1 requirement/)).toBeInTheDocument();
    expect(withinProjectB.getByText(/1 service/)).toBeInTheDocument();
    expect(withinProjectB.getByText("Go to project")).toBeInTheDocument();
  });

  it("Should sort projects by status and name", async () => {
    const mockProjectsMultiple = {
      data: {
        1: {
          data: {
            id: 1,
            name: "Project B",
            status: "EDITABLE",
          },
        },
        2: {
          data: {
            id: 2,
            name: "Project A",
            status: "UNDER_REVIEW",
          },
        },
        3: {
          data: {
            id: 3,
            name: "Project C",
            status: "COMPLETED",
          },
        },
      },
      initialised: true,
      fetching: false,
      fetchError: null,
    };

    renderProjectsPane(mockProjectsMultiple);

    await waitFor(() => {
      const projectCards = screen.getAllByRole("heading", { level: 5 });
      // Should be sorted as: UNDER_REVIEW, EDITABLE, COMPLETED
      expect(projectCards[0]).toHaveTextContent("Project A"); // UNDER_REVIEW
      expect(projectCards[1]).toHaveTextContent("Project B"); // EDITABLE
      expect(projectCards[2]).toHaveTextContent("Project C"); // COMPLETED
    });
  });
});
