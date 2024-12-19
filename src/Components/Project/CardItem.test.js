// src/Components/Project/CardItems.test.js

import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import renderer from "react-test-renderer";
import {
  ProjectStatusListItem,
  ProjectConsortiumListItem,
  ProjectCollaboratorsListItem,
  ProjectCreatedAtListItem,
  ProjectTagItem,
  TagConsortiumItem,
} from "./CardItems";
import { useConsortia, useCurrentUser } from "../../api";
import { useNestedResource } from "../../rest-resource";
import moment from "moment";

// Mock necessary hooks and modules
jest.mock("../../api", () => ({
  ...jest.requireActual("../../api"),
  useCurrentUser: jest.fn(),
  useConsortia: jest.fn(),
}));

jest.mock("../../rest-resource", () => ({
  ...jest.requireActual("../../rest-resource"),
  useNestedResource: jest.fn(),
}));

jest.mock("moment", () => () => ({ fromNow: () => "2 days ago" }));

describe("CardItems Components", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // Helper function to render ProjectStatusListItem
  const renderProjectStatus = (status) => {
    const project = { data: { status } };
    render(<ProjectStatusListItem project={project} />);
  };

  // Helper function to render ProjectConsortiumListItem
  const renderProjectConsortium = (
    projectData,
    consortiaData,
    currentUserId
  ) => {
    useConsortia.mockReturnValue({ fetchable: true, data: consortiaData });
    useCurrentUser.mockReturnValue({ data: { id: currentUserId } });
    render(
      <Router>
        <ProjectConsortiumListItem project={{ data: projectData }} />
      </Router>
    );
  };

  // Helper function to render ProjectCollaboratorsListItem
  const renderProjectCollaborators = (
    projectData,
    collaboratorsData,
    currentUserId,
    initialised
  ) => {
    useCurrentUser.mockReturnValue({ data: { id: currentUserId } });
    useNestedResource.mockReturnValue({ data: collaboratorsData, initialised });
    render(<ProjectCollaboratorsListItem project={{ data: projectData }} />);
  };

  // Helper function to render ProjectCreatedAtListItem
  const renderProjectCreatedAt = (createdAt) => {
    const project = { data: { created_at: createdAt } };
    render(<ProjectCreatedAtListItem project={project} />);
  };

  // Helper function to render ProjectTagItem
  const renderProjectTag = (tagsData) => {
    return render(<ProjectTagItem tags={{ data: tagsData }} />);
  };

  it("Should match snapshot", () => {
    // Mock necessary data
    const project = {
      data: {
        status: "EDITABLE",
        consortium: 1,
        created_at: "2023-01-01T00:00:00Z",
        current_user_role: "Member",
        num_collaborators: 3,
      },
    };

    const consortiaData = {
      1: { data: { id: 1, name: "Test Consortium", manager: { id: 2 } } },
    };

    // Mock hooks
    useConsortia.mockReturnValue({
      fetchable: true,
      data: consortiaData,
      fetching: false,
      initialised: true,
    });

    useCurrentUser.mockReturnValue({
      data: { id: 1 },
      fetching: false,
      initialised: true,
    });

    useNestedResource.mockReturnValue({
      data: {},
      initialised: false,
    });

    // Create component tree
    const component = renderer.create(
      <Router>
        <div>
          <ProjectStatusListItem project={project} />
          <ProjectConsortiumListItem project={project} />
          <ProjectCollaboratorsListItem project={project} />
          <ProjectCreatedAtListItem project={project} />
          <ProjectTagItem tags={{ data: {} }} />
        </div>
      </Router>
    );

    // Generate and verify snapshot
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("Should render ProjectStatusListItem with status EDITABLE", () => {
    // Render the component with status 'EDITABLE'
    renderProjectStatus("EDITABLE");

    // Get the element by class name instead of role
    const listItem = screen.getByText(/Project is/);
    expect(listItem).toHaveClass("list-group-item", "list-group-item-warning");
    expect(listItem).toHaveTextContent(/EDITABLE/);
  });

  it("Should render ProjectStatusListItem with status UNDER_REVIEW", () => {
    // Render the component with status 'UNDER_REVIEW'
    renderProjectStatus("UNDER_REVIEW");

    const listItem = screen.getByText(/Project is/);
    expect(listItem).toHaveClass("list-group-item", "list-group-item-info");
    expect(listItem).toHaveTextContent(/UNDER_REVIEW/);
  });

  it("Should render ProjectStatusListItem with status COMPLETED", () => {
    // Render the component with status 'COMPLETED'
    renderProjectStatus("COMPLETED");

    const listItem = screen.getByText(/Project is/);
    expect(listItem).toHaveClass("list-group-item", "list-group-item-light");
    expect(listItem).toHaveTextContent(/COMPLETED/);
  });

  it("Should display consortium name when data is available", () => {
    // Mock data
    const project = {
      data: {
        consortium: 1,
      },
    };

    // Mock hooks with proper initialised state
    useConsortia.mockReturnValue({
      fetchable: true,
      data: {
        1: {
          data: {
            id: 1,
            name: "Test Consortium",
          },
        },
      },
      fetching: false,
      initialised: true,
    });

    render(
      <Router>
        <TagConsortiumItem project={project} />
      </Router>
    );
    expect(screen.getByText("Test Consortium")).toBeInTheDocument();
  });

  it("Should render ProjectConsortiumListItem when user is consortium manage", () => {
    const projectData = { consortium: 1 };
    const consortiaData = {
      1: { data: { id: 1, name: "Consortium A", manager: { id: 2 } } },
    };

    useConsortia.mockReturnValue({
      fetchable: true,
      data: consortiaData,
      fetching: false,
      initialised: true,
    });

    useCurrentUser.mockReturnValue({
      data: { id: 2 },
      fetching: false,
      initialised: true,
    });

    render(
      <Router>
        <ProjectConsortiumListItem project={{ data: projectData }} />
      </Router>
    );

    // Test manager-specific UI elements
    expect(screen.getByText(/Project belongs to/)).toBeInTheDocument();
    const consortiumLink = screen.getByRole("link", { name: "Consortium A" });
    expect(consortiumLink).toBeInTheDocument();
    expect(consortiumLink).toHaveAttribute("href", "/consortia/1");
    expect(
      screen.getByText("You are the consortium manager.")
    ).toBeInTheDocument();
  });

  it("Should render ProjectConsortiumListItem when user is not consortium manager", () => {
    // Mock data where the current user is not the consortium manager
    const projectData = { consortium: 1 };
    const consortiaData = {
      1: { data: { id: 1, name: "Consortium A", manager: { id: 3 } } },
    };

    // Mock hooks with proper initialised state
    useConsortia.mockReturnValue({
      fetchable: true,
      data: consortiaData,
      fetching: false,
      initialised: true,
    });

    useCurrentUser.mockReturnValue({
      data: { id: 2 },
      fetching: false,
      initialised: true,
    });

    render(
      <Router>
        <ProjectConsortiumListItem project={{ data: projectData }} />
      </Router>
    );

    // Verify consortium name without link and absence of manager message
    expect(screen.getByText(/Project belongs to/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Consortium A" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Consortium A")).toBeInTheDocument();
    expect(
      screen.queryByText("You are the consortium manager.")
    ).not.toBeInTheDocument();
  });

  it("Should display loading state in ProjectConsortiumListItem", () => {
    // Mock loading state
    useConsortia.mockReturnValue({ fetchable: true, data: null });
    useCurrentUser.mockReturnValue({ data: { id: 2 } });
    const project = { data: { consortium: 1 } };

    // Render the component
    render(
      <Router>
        <ProjectConsortiumListItem project={project} />
      </Router>
    );

    // Verify loading message is displayed
    expect(screen.getByText("Loading consortia...")).toBeInTheDocument();
  });

  it("Should display error in ProjectConsortiumListItem when data is unavailable", () => {
    // Mock hooks with unavailable state
    useConsortia.mockReturnValue({
      fetchable: false,
      data: null,
      fetching: false,
      initialised: false,
      fetchError: new Error("Failed to load consortia"),
    });

    useCurrentUser.mockReturnValue({
      data: { id: 2 },
      fetching: false,
      initialised: false,
    });

    const project = { data: { consortium: 1 } };

    render(
      <Router>
        <ProjectConsortiumListItem project={project} />
      </Router>
    );

    // Check error message
    expect(screen.getByText("Unable to load consortia.")).toBeInTheDocument();
  });

  it("Should render ProjectCollaboratorsListItem with collaborators loaded", () => {
    // Mock data with collaborators loaded
    const projectData = { num_collaborators: 3, current_user_role: "Member" };
    const collaboratorsData = {
      1: { data: { user: { id: 1 }, role: "Member" } },
      2: { data: { user: { id: 2 }, role: "Manager" } },
      3: { data: { user: { id: 3 }, role: "Viewer" } },
    };
    const currentUserId = 1;
    const initialised = true;

    // Render the component
    renderProjectCollaborators(
      projectData,
      collaboratorsData,
      currentUserId,
      initialised
    );

    // Verify collaborator count and user role
    expect(screen.getByText(/Project has/)).toBeInTheDocument();
    expect(screen.getByText(/3 collaborators/)).toBeInTheDocument();

    expect(screen.getByText(/You are a/)).toBeInTheDocument();
    expect(screen.getByText(/member/)).toBeInTheDocument();
  });

  it("Should render ProjectCollaboratorsListItem when collaborators are not loaded", () => {
    // Mock data with collaborators not loaded
    const projectData = { num_collaborators: 3, current_user_role: "Member" };
    const collaboratorsData = {};
    const currentUserId = 1;
    const initialised = false;

    // Render the component
    renderProjectCollaborators(
      projectData,
      collaboratorsData,
      currentUserId,
      initialised
    );

    // Verify collaborator count and user role
    expect(screen.getByText(/Project has/)).toBeInTheDocument();
    expect(screen.getByText(/3 collaborators/)).toBeInTheDocument();
    expect(screen.getByText(/You are a/)).toBeInTheDocument();
    expect(screen.getByText(/member/)).toBeInTheDocument();
  });

  it("Should render ProjectCollaboratorsListItem when user has no role", () => {
    // Mock data when user has no role
    const projectData = { num_collaborators: 2 };
    const collaboratorsData = {};
    const currentUserId = 1;
    const initialised = false;

    // Render the component
    renderProjectCollaborators(
      projectData,
      collaboratorsData,
      currentUserId,
      initialised
    );

    // Verify collaborator count and absence of user role
    expect(screen.getByText(/Project has/)).toBeInTheDocument();
    expect(screen.getByText(/2 collaborators/)).toBeInTheDocument();
    expect(screen.queryByText(/You are/)).not.toBeInTheDocument();
  });

  it("Should display correct creation time in ProjectCreatedAtListItem", () => {
    // Render the component with a specific creation date
    renderProjectCreatedAt("2021-01-01T00:00:00Z");

    // Verify the creation time is displayed correctly
    expect(screen.getByText(/Project was created/)).toBeInTheDocument();
    expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
  });

  it("Should render ProjectTagItem with tags present", () => {
    // Mock tags data
    const tagsData = {
      1: { data: { name: "Tag1" } },
      2: { data: { name: "Tag2" } },
    };

    // Render the component
    renderProjectTag(tagsData);

    // Verify tags are displayed
    expect(screen.getByText("Tags:")).toBeInTheDocument();
    expect(screen.getByText("Tag1")).toBeInTheDocument();
    expect(screen.getByText("Tag2")).toBeInTheDocument();
  });

  it("Should handle singular collaborator text correctly", () => {
    // Test case for exactly 1 collaborator
    const projectData = { num_collaborators: 1, current_user_role: "Member" };
    const collaboratorsData = {
      1: { data: { user: { id: 1 }, role: "Member" } },
    };

    useCurrentUser.mockReturnValue({ data: { id: 1 } });
    useNestedResource.mockReturnValue({
      data: collaboratorsData,
      initialised: true,
    });

    render(<ProjectCollaboratorsListItem project={{ data: projectData }} />);

    // Verify singular form is used
    expect(screen.getByText(/Project has/)).toBeInTheDocument();
    expect(screen.getByText(/1 collaborator/)).toBeInTheDocument();
    expect(screen.queryByText(/collaborators/)).not.toBeInTheDocument();
  });
});
