import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { CollaboratorsListItems } from "./CollaboratorsListItems";
import { useProjectPermissions } from "./actions";
import { useCurrentUser } from "../../api";
import { useNotifications } from "react-bootstrap-notify";
import { act } from "react-dom/test-utils";
import { useHistory } from "react-router-dom";
import renderer from "react-test-renderer";

// Mock the dependencies
jest.mock("moment", () => {
  const mockMoment = () => ({
    fromNow: () => "a few days ago",
  });
  return mockMoment;
});

jest.mock("./actions", () => ({
  useProjectPermissions: jest.fn(),
}));

jest.mock("../../api", () => ({
  useCurrentUser: jest.fn(),
}));

jest.mock("../../rest-resource", () => ({
  InstanceDeleteButton: ({ children, disabled, onSuccess, onError }) => (
    <div>
      <button
        onClick={() => {
          if (onSuccess) onSuccess();
          if (onError) onError(new Error("Delete failed"));
        }}
        disabled={disabled}
        data-testid="delete-button"
      >
        Delete collaborator
      </button>
      {children}
    </div>
  ),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: jest.fn(),
}));

jest.mock("react-select", () => {
  const ReactSelect = ({ options, value, onChange, isDisabled }) => {
    const handleChange = (e) => {
      const selectedOption = options.find(
        (opt) => opt.value === e.target.value
      );
      onChange(selectedOption);
    };

    return (
      <select
        data-testid="role-select"
        value={value?.value || ""}
        onChange={handleChange}
        disabled={isDisabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };
  return ReactSelect;
});

describe("CollaboratorsListItems Components", () => {
  const mockProject = { id: 1, name: "Test Project", data: { consortium: 1 } };
  const mockCollaborators = {
    data: {
      1: {
        data: {
          id: 1,
          user: {
            id: 1,
            username: "user1",
            first_name: "User",
            last_name: "One",
          },
          role: "OWNER",
          created_at: "2025-01-06T00:00:00Z",
        },
      },
      2: {
        data: {
          id: 2,
          user: {
            id: 2,
            username: "user2",
            first_name: "User",
            last_name: "Two",
          },
          role: "CONTRIBUTOR",
          created_at: "2025-01-05T00:00:00Z",
        },
      },
    },
  };

  const mockNotify = jest.fn();
  useNotifications.mockReturnValue(mockNotify);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderCollaboratorsListItems = (permissions, currentUser) => {
    useProjectPermissions.mockReturnValue(permissions);
    useCurrentUser.mockReturnValue(currentUser);

    render(
      <Router>
        <CollaboratorsListItems
          project={mockProject}
          collaborators={mockCollaborators}
        />
      </Router>
    );
  };

  describe("CollaboratorsListItems", () => {
    it("Should match the snapshot", () => {
      const component = renderer.create(
        renderCollaboratorsListItems(
          { canEditCollaborators: true },
          { data: { id: 1 } },
          mockCollaborators
        )
      );

      let tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });

    it("Should render a list of collaborators with edit permissions", () => {
      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } }
      );

      // Check that the collaborators are rendered
      expect(screen.getByText("User One (user1)")).toBeInTheDocument();
      expect(screen.getByText("User Two (user2)")).toBeInTheDocument();

      // Check that the role select and delete button are rendered
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      expect(
        screen.getAllByRole("button", { name: /Delete collaborator/i })
      ).toHaveLength(2);
    });

    it("Should render a list of collaborators without edit permissions", () => {
      renderCollaboratorsListItems(
        { canEditCollaborators: false },
        { data: { id: 1 } }
      );

      // Check that the collaborators are rendered
      expect(screen.getByText("User One (user1)")).toBeInTheDocument();
      expect(screen.getByText("User Two (user2)")).toBeInTheDocument();

      // Check that the role select and delete button are not rendered
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /delete/i })
      ).not.toBeInTheDocument();
    });

    it("Should disable delete button for sole owner", () => {
      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } }
      );

      // Check that the delete button for the sole owner is disabled
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });

      expect(deleteButtons[0]).toBeDisabled();
      expect(deleteButtons[1]).not.toBeDisabled();
    });

    it("Should render collaborator details correctly", () => {
      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } }
      );

      // Check that the collaborator details are rendered correctly
      expect(screen.getByText("User One (user1)")).toBeInTheDocument();
      expect(screen.getByText("User Two (user2)")).toBeInTheDocument();
      expect(screen.getAllByText("Added a few days ago")).toHaveLength(2);
    });

    it("Should render collaborator role select correctly", () => {
      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } }
      );

      // Check that the role select is rendered correctly
      const roleSelects = screen.getAllByRole("combobox");
      expect(roleSelects[0]).toHaveDisplayValue("OWNER");
      expect(roleSelects[1]).toHaveDisplayValue("CONTRIBUTOR");
    });

    it("Should render delete button correctly", () => {
      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } }
      );

      // Check that the delete button is rendered correctly
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it("Should handle role change successfully", async () => {
      const mockNotify = jest.fn();
      useNotifications.mockReturnValue(mockNotify);

      // Setup mock data with update function
      const mockCollaborator = {
        ...mockCollaborators.data[1],
        data: {
          ...mockCollaborators.data[1].data,
          role: "CONTRIBUTOR",
        },
        update: jest.fn().mockResolvedValue({}),
      };

      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } }
      );

      // Find role select by its text content
      const ownerRole = screen.getByDisplayValue("OWNER");
      const contributorRole = screen.getByDisplayValue("CONTRIBUTOR");

      expect(ownerRole).toBeInTheDocument();
      expect(contributorRole).toBeInTheDocument();

      // Change the role
      await act(async () => {
        fireEvent.change(contributorRole, { target: { value: "OWNER" } });
      });

      // Verify only one OWNER is displayed since the sole owner can't be changed
      expect(screen.getAllByDisplayValue("OWNER")).toHaveLength(1);
      expect(screen.getByDisplayValue("CONTRIBUTOR")).toBeInTheDocument();
    });

    it("Should handle error on role update", async () => {
      const mockNotify = jest.fn();
      useNotifications.mockReturnValue(mockNotify);

      // Create mock collaborators with an error-throwing update function
      const mockCollaboratorsWithError = {
        data: {
          1: {
            ...mockCollaborators.data[1],
            update: jest.fn().mockRejectedValue(new Error("Update failed")),
          },
          2: mockCollaborators.data[2],
        },
      };

      render(
        <Router>
          <CollaboratorsListItems
            project={mockProject}
            collaborators={mockCollaboratorsWithError}
          />
        </Router>
      );

      // Find and change the role select
      const roleSelect = screen.getAllByRole("combobox")[0];
      await act(async () => {
        fireEvent.change(roleSelect, { target: { value: "OWNER" } });
      });

      // Verify the error notification was shown
      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalled();
      });
    });

    it("Should redirect to projects page when user deletes themselves", async () => {
      const history = { push: jest.fn() };
      useHistory.mockReturnValue(history);
      useCurrentUser.mockReturnValue({ data: { id: 1 } });

      const mockCollaborators = {
        data: {
          1: {
            data: {
              id: 1,
              user: {
                id: 1,
                username: "user1",
                first_name: "User",
                last_name: "One",
              },
              role: "OWNER",
              created_at: "2025-01-06T00:00:00Z",
            },
          },
          2: {
            data: {
              id: 2,
              user: {
                id: 2,
                username: "user2",
                first_name: "User",
                last_name: "Two",
              },
              role: "OWNER",
              created_at: "2025-01-05T00:00:00Z",
            },
          },
          3: {
            data: {
              id: 3,
              user: {
                id: 3,
                username: "user3",
                first_name: "User",
                last_name: "Three",
              },
              role: "CONTRIBUTOR",
              created_at: "2025-01-04T00:00:00Z",
            },
          },
        },
      };

      render(
        <Router>
          <CollaboratorsListItems
            project={mockProject}
            collaborators={mockCollaborators}
          />
        </Router>
      );

      const deleteButton = screen.getAllByRole("button", {
        name: /delete/i,
      })[0];

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(history.push).toHaveBeenCalledWith("/projects");
      });
    });

    const renderCollaboratorsListItems = (
      permissions,
      currentUser,
      collaborators = mockCollaborators
    ) => {
      useProjectPermissions.mockReturnValue(permissions);
      useCurrentUser.mockReturnValue(currentUser);

      render(
        <Router>
          <CollaboratorsListItems
            project={mockProject}
            collaborators={collaborators}
          />
        </Router>
      );
    };

    it("Should display username when last name is not available", () => {
      const mockCollaboratorsNoLastName = {
        data: {
          1: {
            data: {
              id: 1,
              user: {
                id: 1,
                username: "testuser",
                first_name: "Test",
              },
              role: "OWNER",
              created_at: "2023-01-01T00:00:00Z",
            },
          },
        },
      };

      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } },
        mockCollaboratorsNoLastName
      );

      expect(screen.getByText("testuser")).toBeInTheDocument();
    });

    it("Should handle error on collaborator deletion", async () => {
      const mockNotify = jest.fn();
      useNotifications.mockReturnValue(mockNotify);

      const mockCollaboratorsWithDeleteError = {
        data: {
          1: {
            ...mockCollaborators.data[1],
            delete: jest.fn().mockRejectedValue(new Error("Delete failed")),
            role: "CONTRIBUTOR",
            deleting: false,
            updating: false,
            data: {
              id: 1,
              user: {
                id: 1,
                username: "user1",
                first_name: "User",
              },
              role: "CONTRIBUTOR",
              created_at: "2023-01-01T00:00:00Z",
            },
          },
        },
      };

      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } },
        mockCollaboratorsWithDeleteError
      );

      // Click initial delete button to open modal
      const deleteButton = screen.getByTestId("delete-button");
      fireEvent.click(deleteButton);

      // Find and click the confirm delete button in the modal footer
      const confirmDeleteButton = screen.getByRole("button", {
        name: /delete/i,
      });
      fireEvent.click(confirmDeleteButton);

      // Verify notification was shown
      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining("Delete failed"),
          })
        );
      });
    });

    it("Should disable role select when collaborator is updating", () => {
      const mockCollaboratorsUpdating = {
        data: {
          1: {
            data: {
              id: 1,
              user: {
                id: 1,
                username: "user1",
                first_name: "User",
                last_name: "One",
              },
              role: "OWNER",
              created_at: "2023-01-01T00:00:00Z",
            },
            updating: true,
          },
        },
      };

      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } },
        mockCollaboratorsUpdating
      );

      const roleSelect = screen.getByRole("combobox");
      expect(roleSelect).toBeDisabled();
    });

    it("Should handle deletion of another user without redirect", async () => {
      const history = { push: jest.fn() };
      useHistory.mockReturnValue(history);

      // Mock current user with different ID than collaborator
      useCurrentUser.mockReturnValue({ data: { id: 999 } });

      const mockCollaboratorsOtherUser = {
        data: {
          1: {
            ...mockCollaborators.data[1],
            delete: jest.fn().mockResolvedValue({}),
            data: {
              id: 1,
              user: {
                id: 2, // Different from current user id
                username: "other",
                first_name: "Other",
              },
              role: "CONTRIBUTOR",
              created_at: "2023-01-01T00:00:00Z",
            },
          },
        },
      };

      renderCollaboratorsListItems(
        { canEditCollaborators: true },
        { data: { id: 1 } },
        mockCollaboratorsOtherUser
      );

      // Click delete and confirm
      const deleteButton = screen.getByTestId("delete-button");
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(confirmButton);

      // Verify no redirect happened
      await waitFor(() => {
        expect(history.push).not.toHaveBeenCalled();
      });
    });
  });
});
