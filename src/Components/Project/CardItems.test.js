// src/Components/Project/CardItems.test.js

import React from "react";
import { render, screen, within } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import renderer from "react-test-renderer";
import moment from "moment";
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

  // Tests for ProjectStatusListItem
  describe("ProjectStatusListItem", () => {
    // Helper function to render ProjectStatusListItem
    const renderProjectStatus = (status) => {
      const project = { data: { status } };
      render(<ProjectStatusListItem project={project} />);
    };

    it("Should render with status EDITABLE", () => {
      // Render the component with status 'EDITABLE'
      renderProjectStatus("EDITABLE");

      const listItem = screen.getByText(/Project is/);
      expect(listItem).toHaveClass(
        "list-group-item",
        "list-group-item-warning"
      );
      expect(listItem).toHaveTextContent(/EDITABLE/);
    });

    it("Should render with status UNDER_REVIEW", () => {
      // Render the component with status 'UNDER_REVIEW'
      renderProjectStatus("UNDER_REVIEW");

      const listItem = screen.getByText(/Project is/);
      expect(listItem).toHaveClass("list-group-item", "list-group-item-info");
      expect(listItem).toHaveTextContent(/UNDER_REVIEW/);
    });

    it("Should render with status COMPLETED", () => {
      // Render the component with status 'COMPLETED'
      renderProjectStatus("COMPLETED");

      const listItem = screen.getByText(/Project is/);
      expect(listItem).toHaveClass("list-group-item", "list-group-item-light");
      expect(listItem).toHaveTextContent(/COMPLETED/);
    });
  });

  // Tests for ProjectConsortiumListItem
  describe("ProjectConsortiumListItem", () => {
    // Helper function to render ProjectConsortiumListItem
    const renderProjectConsortium = (
      projectData,
      consortiaData,
      currentUserId
    ) => {
      useConsortia.mockReturnValue({
        fetchable: true,
        data: consortiaData,
        fetching: false,
        initialised: true,
      });
      useCurrentUser.mockReturnValue({
        data: { id: currentUserId },
        fetching: false,
        initialised: true,
      });
      render(
        <Router>
          <ProjectConsortiumListItem project={{ data: projectData }} />
        </Router>
      );
    };

    it("Should render correctly when user is consortium manager", () => {
      // Mock data where the current user is the consortium manager
      const projectData = { consortium: 1 };
      const consortiaData = {
        1: { data: { id: 1, name: "Consortium A", manager: { id: 2 } } },
      };

      renderProjectConsortium(projectData, consortiaData, 2);

      // Verify consortium name with link and manager message
      expect(screen.getByText(/Project belongs to/)).toBeInTheDocument();
      const consortiumLink = screen.getByRole("link", { name: "Consortium A" });
      expect(consortiumLink).toBeInTheDocument();
      expect(consortiumLink).toHaveAttribute("href", "/consortia/1");
      expect(
        screen.getByText("You are the consortium manager.")
      ).toBeInTheDocument();
    });

    it("Should render correctly when user is not consortium manager", () => {
      // Mock data where the current user is not the consortium manager
      const projectData = { consortium: 1 };
      const consortiaData = {
        1: { data: { id: 1, name: "Consortium A", manager: { id: 3 } } },
      };

      renderProjectConsortium(projectData, consortiaData, 2);

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
  });

  // Tests for ProjectCollaboratorsListItem
  describe("ProjectCollaboratorsListItem", () => {
    // Helper function to render ProjectCollaboratorsListItem
    const renderProjectCollaborators = (
      projectData,
      collaboratorsData,
      currentUserId,
      initialised
    ) => {
      useCurrentUser.mockReturnValue({
        data: { id: currentUserId },
        fetching: false,
        initialised: true,
      });
      useNestedResource.mockReturnValue({
        data: collaboratorsData,
        initialised,
        fetching: false,
      });

      render(<ProjectCollaboratorsListItem project={{ data: projectData }} />);
    };

    it("Should handlde singular collaborator text correctly", () => {
      // Test case for exactly 1 collaborator
      const projectData = {
        num_collaborators: 1,
        current_user_role: "Member",
      };
      const collaboratorsData = {
        1: { data: { user: { id: 1 }, role: "Member" } },
      };

      renderProjectCollaborators(projectData, collaboratorsData, 1, true);

      // Verify singular form is used
      expect(screen.getByText(/Project has/)).toBeInTheDocument();
      expect(screen.getByText(/1 collaborator/)).toBeInTheDocument();
      expect(screen.queryByText(/collaborators/)).not.toBeInTheDocument();
    });

    it("Should handle vowel-starting roles correctly", () => {
      // Test case for role starting with vowel (e.g., "OWNER")
      const projectData = {
        num_collaborators: 1,
        current_user_role: "OWNER",
      };
      const collaboratorsData = {};

      renderProjectCollaborators(projectData, collaboratorsData, 1, false);

      // Verify "an" is used instead of "a"
      expect(screen.getByText(/You are an/)).toBeInTheDocument();
      expect(screen.getByText(/owner/)).toBeInTheDocument();
    });

    it("Should default to 0 collaborators when no data is available", () => {
      // Mock data with undefined num_collaborators and empty collaborators data
      const projectData = {};
      const collaboratorsData = {};

      renderProjectCollaborators(projectData, collaboratorsData, 1, true);

      // Verify that "0 collaborators" is displayed
      expect(screen.getByText(/Project has/)).toBeInTheDocument();
      expect(screen.getByText(/0 collaborators/)).toBeInTheDocument();
    });
  });

  // Tests for ProjectCreatedAtListItem
  describe("ProjectCreatedAtListItem", () => {
    it("Should render the creation date correctly", () => {
      const project = { data: { created_at: "2021-01-01T00:00:00Z" } };

      render(<ProjectCreatedAtListItem project={project} />);

      expect(screen.getByText(/Project was created/)).toBeInTheDocument();
      expect(screen.getByText("2 days ago")).toBeInTheDocument();
    });
  });

  // Tests for ProjectTagItem
  describe("ProjectTagItem", () => {
    it("Should render tags when they are available", () => {
      const tags = {
        data: {
          1: { data: { name: "Tag1" } },
          2: { data: { name: "Tag2" } },
        },
      };

      render(<ProjectTagItem tags={tags} />);

      expect(screen.getByText(/Tags:/)).toBeInTheDocument();
      expect(screen.getByText(/Tag1/)).toBeInTheDocument();
      expect(screen.getByText(/Tag2/)).toBeInTheDocument();
    });

    it("Should not render when there are no tags", () => {
      const tags = { data: {} };

      render(<ProjectTagItem tags={tags} />);

      expect(screen.queryByText(/Tags:/)).not.toBeInTheDocument();
    });
  });

  // Tests for TagConsortiumItem
  describe("TagConsortiumItem", () => {
    it("Should render consortium name when data is available", () => {
      const project = { data: { consortium: 1 } };
      const consortiaData = {
        1: { data: { name: "Consortium A" } },
      };

      useConsortia.mockReturnValue({
        fetchable: true,
        data: consortiaData,
        fetching: false,
        initialised: true,
      });

      render(<TagConsortiumItem project={project} />);

      expect(screen.getByText("Consortium A")).toBeInTheDocument();
    });

    it("Should show loading state when fetching consortia", () => {
      const project = { data: { consortium: 1 } };

      useConsortia.mockReturnValue({
        fetchable: true,
        fetching: true,
        initialised: false,
      });

      render(<TagConsortiumItem project={project} />);

      expect(screen.getByText("Loading consortia...")).toBeInTheDocument();
    });
  });

  // Snapshot Test
  describe("Snapshot tests", () => {
    it("Should match the snapshot for default rendering", () => {
      const project = { data: { status: "EDITABLE", consortium: 1 } };
      const consortiaData = {
        1: { data: { id: 1, name: "Consortium A", manager: { id: 1 } } },
      };

      // Mock hooks with initial data
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
        fetching: false,
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
  });
});
