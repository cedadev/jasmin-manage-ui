import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  CollaboratorsModalBody,
  ProjectCollaboratorsLink,
} from "./CollaboratorsLink";
import { useNestedResource } from "../../rest-resource";
import { useProjectPermissions } from "./actions";

// Mock all dependencies
jest.mock("../../rest-resource", () => ({
  Status: {
    Many: ({ children }) => children,
    Loading: ({ children }) => children,
    Unavailable: ({ children }) => children,
    Available: ({ children }) => children,
  },
  useNestedResource: jest.fn(),
}));

jest.mock("./actions", () => ({
  useProjectPermissions: jest.fn(),
}));

jest.mock("./CollaboratorsListItems", () => ({
  CollaboratorsListItems: () => <div data-testid="collaborators-list" />,
}));

jest.mock("./InvitationsListItems", () => ({
  InvitationsListItems: () => <div data-testid="invitations-list" />,
}));

describe("CollaboratorsLink Components", () => {
  const mockProject = { id: 1 };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("CollaboratorsModalBody", () => {
    it("Should show loading state", () => {
      useNestedResource.mockReturnValue({ fetching: true });
      render(<CollaboratorsModalBody project={mockProject} />);
      expect(screen.getByText("Loading collaborators...")).toBeInTheDocument();
    });

    it("Should show error state", () => {
      useNestedResource.mockReturnValue({ fetchable: false });
      render(<CollaboratorsModalBody project={mockProject} />);
      expect(
        screen.getByText("Unable to load collaborators.")
      ).toBeInTheDocument();
    });

    it("Should show content when data is available", () => {
      useNestedResource.mockReturnValue({
        fetchable: true,
        data: {},
        initialised: true,
      });
      render(<CollaboratorsModalBody project={mockProject} />);
      expect(screen.getByTestId("collaborators-list")).toBeInTheDocument();
      expect(screen.getByTestId("invitations-list")).toBeInTheDocument();
    });
  });

  describe("ProjectCollaboratorsLink", () => {
    beforeEach(() => {
      useNestedResource
        .mockReturnValue({
          data: {},
          creating: false,
          fetching: false,
          initialised: true,
          fetchable: true,
        })
        .mockReturnValue({
          data: {},
          creating: false,
          fetching: false,
          initialised: true,
          fetchable: true,
        });
      useProjectPermissions.mockReturnValue({ canEditCollaborators: false });
    });

    it("Should render children and show modal on click", () => {
      render(
        <ProjectCollaboratorsLink project={mockProject}>
          Test Link
        </ProjectCollaboratorsLink>
      );

      fireEvent.click(screen.getByText("Test Link"));
      expect(screen.getByText("Project collaborators")).toBeInTheDocument();
    });

    it("Should disable cancel button during updates", async () => {
      useNestedResource.mockReturnValue({
        data: {
          1: { data: {}, updating: true, deleting: false },
        },
        creating: false,
        fetching: false,
        initialised: true,
        fetchable: true,
      });

      useProjectPermissions.mockReturnValue({
        canEditCollaborators: false,
      });

      render(
        <ProjectCollaboratorsLink project={mockProject}>
          Test Link
        </ProjectCollaboratorsLink>
      );

      fireEvent.click(screen.getByText("Test Link"));

      await waitFor(() => {
        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
      });
    });

    it("Should disable cancel button when collaborator is deleting", async () => {
      useNestedResource.mockReturnValue({
        data: {
          1: { data: {}, updating: false, deleting: true },
        },
        creating: false,
        fetchable: true,
        initialised: true,
      });

      useProjectPermissions.mockReturnValue({
        canEditCollaborators: false,
      });

      render(
        <ProjectCollaboratorsLink project={mockProject}>
          Test Link
        </ProjectCollaboratorsLink>
      );

      fireEvent.click(screen.getByText("Test Link"));

      await waitFor(() => {
        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        expect(cancelButton).toBeDisabled();
      });
    });

    it("Should disable cancel button when any invitation is updating", () => {
      // Mock collaborators (first call)
      useNestedResource.mockReturnValue({
        data: {},
        creating: false,
        fetching: false,
        initialised: true,
        fetchable: true,
      });
      // Mock invitations with an updating invitation (second call)
      useNestedResource.mockReturnValue({
        data: {
          1: { data: {}, updating: true, deleting: false },
        },
        creating: false,
        fetching: false,
        initialised: true,
        fetchable: true,
      });

      render(
        <ProjectCollaboratorsLink project={mockProject}>
          Test Link
        </ProjectCollaboratorsLink>
      );

      // Open the modal
      fireEvent.click(screen.getByText("Test Link"));

      // Check if the cancel button is disabled
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
    it("Should disable cancel button when any invitation is deleting", () => {
      // Mock collaborators (first call)
      useNestedResource.mockReturnValue({
        data: {},
        creating: false,
        fetching: false,
        initialised: true,
        fetchable: true,
      });
      // Mock invitations with a deleting invitation (second call)
      useNestedResource.mockReturnValue({
        data: {
          1: { data: {}, updating: false, deleting: true },
        },
        creating: false,
        fetching: false,
        initialised: true,
        fetchable: true,
      });

      render(
        <ProjectCollaboratorsLink project={mockProject}>
          Test Link
        </ProjectCollaboratorsLink>
      );

      // Open the modal
      fireEvent.click(screen.getByText("Test Link"));

      // Check if the cancel button is disabled
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it("Should enable cancel button when no updates in progress", () => {
      useNestedResource
        .mockReturnValueOnce({
          data: {},
          creating: false,
          fetchable: true,
          initialised: true,
        })
        .mockReturnValueOnce({
          data: {},
          creating: false,
          fetchable: true,
          initialised: true,
        });

      useProjectPermissions.mockReturnValue({
        canEditCollaborators: false,
      });

      render(
        <ProjectCollaboratorsLink project={mockProject}>
          Test Link
        </ProjectCollaboratorsLink>
      );

      fireEvent.click(screen.getByText("Test Link"));
      const cancelButton = screen.getByRole("button", {
        name: /cancel/i,
      });

      expect(cancelButton).not.toBeDisabled();
    });

    it("Should use large modal for users with edit permissions", () => {
      // Mock permissions to allow editing
      useProjectPermissions.mockReturnValue({ canEditCollaborators: true });

      // Mock resource to avoid loading state
      useNestedResource.mockReturnValue({
        data: {},
        creating: false,
        fetchable: true,
        initialised: true,
      });

      render(
        <ProjectCollaboratorsLink project={mockProject}>
          Test Link
        </ProjectCollaboratorsLink>
      );

      // Open the modal
      fireEvent.click(screen.getByText("Test Link"));

      // Find modal-dialog element and check for modal-lg class
      const modalDialog = document.querySelector(".modal-dialog");
      expect(modalDialog).toHaveClass("modal-lg");
    });

    it("Should close the modal when Cancel button is clicked", async () => {
      // Mock collaborators (first call)
      useNestedResource.mockReturnValueOnce({
        data: {},
        creating: false,
        fetching: false,
        initialised: true,
        fetchable: true,
      });
      // Mock invitations (second call)
      useNestedResource.mockReturnValueOnce({
        data: {},
        creating: false,
        fetching: false,
        initialised: true,
        fetchable: true,
      });

      render(
        <ProjectCollaboratorsLink project={mockProject}>
          Test Link
        </ProjectCollaboratorsLink>
      );

      // Open the modal
      fireEvent.click(screen.getByText("Test Link"));

      // Verify the modal is open
      expect(screen.getByText("Project collaborators")).toBeInTheDocument();

      // Click the Cancel button
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Wait for the modal to close
      await waitFor(() => {
        expect(
          screen.queryByText("Project collaborators")
        ).not.toBeInTheDocument();
      });
    });
  });
});
