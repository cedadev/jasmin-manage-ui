// src/Components/Project/Detail.test.js

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import renderer from "react-test-renderer";
import userEvent from "@testing-library/user-event";

import ProjectDetailWrapper from "./Detail";
import { useNotifications } from "react-bootstrap-notify";
import {
  useProject,
  useProjectEvents,
  useCurrentUser,
  useConsortia,
  useCategories,
  useResources,
} from "../../api";
import { useNestedResource } from "../../rest-resource";
import { notificationFromError } from "../utils";

// Mock the API hooks
jest.mock("../../api", () => ({
  useProject: jest.fn(),
  useProjectEvents: jest.fn(),
  useCurrentUser: jest.fn(),
  useConsortia: jest.fn(),
  useCategories: jest.fn(),
  useResources: jest.fn(),
}));

// Define MockStatus and its subcomponents
const MockStatus = ({ children }) => <div>{children}</div>;

MockStatus.Loading = ({ children }) => <div>{children}</div>;
MockStatus.Available = ({ children }) => <div>{children}</div>;
MockStatus.Unavailable = ({ children }) => <div>{children}</div>;

// Mock the rest-resource hooks including Status
jest.mock("../../rest-resource", () => ({
  ...jest.requireActual("../../rest-resource"),
  useNestedResource: jest.fn(),
}));

// Mock the notifications
jest.mock("react-bootstrap-notify", () => ({
  useNotifications: jest.fn(),
}));

const mockProject = {
  data: {
    id: 1,
    name: "Project A",
    description: "Description of Project A",
    status: "ACTIVE",
    consortium: 1,
  },
  fetchError: null,
  fetching: false,
  initialised: true,
};

const mockConsortia = {
  data: {
    1: {
      data: {
        id: 1,
        name: "Consortium A",
        manager: { id: 1 },
      },
    },
  },
  fetchError: null,
  fetching: false,
  initialised: true,
};

const mockCurrentUser = {
  data: {
    id: 1,
    username: "testuser",
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
  },
  fetchError: null,
  fetching: false,
  initialised: true,
};

const mockNotifications = jest.fn();

describe("Testing Project Detail Page", () => {
  beforeEach(() => {
    useCurrentUser.mockReturnValue(mockCurrentUser);
    useConsortia.mockReturnValue(mockConsortia);
    useProject.mockReturnValue(mockProject);
    useProjectEvents.mockReturnValue([]);
    useCategories.mockReturnValue({
      data: {},
      fetchError: null,
      fetching: false,
      initialised: true,
    });
    useNestedResource.mockReturnValue({
      data: {},
      fetchError: null,
      fetching: false,
      initialised: true,
    });
    useNotifications.mockReturnValue(mockNotifications);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should match the snapshot", () => {
    const component = renderer.create(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Route path="/projects/:id">
          <ProjectDetailWrapper />
        </Route>
      </MemoryRouter>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("Should display the project name", async () => {
    render(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Route path="/projects/:id">
          <ProjectDetailWrapper />
        </Route>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });
  });

  it("Should display the 'Loading project...' text when fetching", () => {
    useProject.mockReturnValue({
      data: null,
      fetchError: null,
      fetching: true,
      initialised: false,
    });

    render(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Route path="/projects/:id">
          <ProjectDetailWrapper />
        </Route>
      </MemoryRouter>
    );

    expect(screen.getByText("Loading project...")).toBeInTheDocument();
  });

  it("Should redirect to /projects when project is unavailable", async () => {
    useProject.mockReturnValue({
      data: { ...mockProject.data },
    });

    render(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Route path="/projects/:id">
          <ProjectDetailWrapper />
        </Route>
        <Route path="/projects">
          <div>Projects List Page</div>
        </Route>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Projects List Page")).toBeInTheDocument();
    });
  });

  it("Should notify the user when project fetch fails", async () => {
    useProject.mockReturnValue({
      data: { ...mockProject.data },
      fetchError: new Error("Failed to fetch project"),
      fetching: false,
      initialised: true,
    });

    render(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Route path="/projects/:id">
          <ProjectDetailWrapper />
        </Route>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNotifications).toHaveBeenCalledWith(
        notificationFromError(new Error("Failed to fetch project"))
      );
    });
  });

  it("Should display consortium manager instructions when project is under review and user is manager", async () => {
    useProject.mockReturnValue({
      ...mockProject,
      data: { ...mockProject.data, status: "UNDER_REVIEW" },
    });

    useConsortia.mockReturnValueOnce({
      ...mockConsortia,
      data: {
        1: {
          data: {
            ...mockConsortia.data[1].data,
            manager: { id: 1 }, // Current user is manager
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Route path="/projects/:id">
          <ProjectDetailWrapper />
        </Route>
      </MemoryRouter>
    );

    const servicesTab = screen.getByRole("link", { name: "Services" });
    fireEvent.click(servicesTab);

    await waitFor(() => {
      expect(screen.getByText(/please click either/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /once you have made decisions on all the requirements for the project./i
        )
      ).toBeInTheDocument();
    });
  });

  it("Should display edit instructions when project is editable and user is not manager", async () => {
    useProject.mockReturnValue({
      ...mockProject,
      data: { ...mockProject.data, status: "EDITABLE" },
    });

    // Mock current user as ID 2 (non-manager)
    useCurrentUser.mockReturnValue({
      data: {
        id: 2,
        username: "testuser2",
        first_name: "Test",
        last_name: "User2",
        email: "test2@example.com",
      },
      fetchError: null,
      fetching: false,
      initialised: true,
    });

    // Keep manager as ID 1
    useConsortia.mockReturnValue({
      ...mockConsortia,
      data: {
        1: {
          data: {
            ...mockConsortia.data[1].data,
            manager: { id: 1 },
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Route path="/projects/:id">
          <ProjectDetailWrapper />
        </Route>
      </MemoryRouter>
    );

    const servicesTab = screen.getByRole("link", { name: "Services" });
    fireEvent.click(servicesTab);

    await waitFor(() => {
      expect(
        screen.getByText(/Please ensure that you click the/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /button once you have added your requirements to all services./i
        )
      ).toBeInTheDocument();
    });
  });

  it("Should display delete/edit instructions when there are rejected requirements and user is not manager", async () => {
    // Mock resources
    useResources.mockReturnValue({
      data: {
        1: {
          data: {
            id: 1,
            name: "Resource 1",
            short_name: "R1",
            units: "GB",
          },
        },
      },
      initialised: true,
    });

    // Mock categories
    useCategories.mockReturnValue({
      data: {
        1: {
          data: {
            id: 1,
            name: "Category 1",
            resources: [1],
          },
        },
      },
      initialised: true,
    });

    // Mock project with rejected requirements
    useNestedResource.mockImplementation((resource, name) => {
      const mockInstance = {
        data: {
          1: {
            data: {
              id: 1,
              name: "Service 1",
              category: 1,
              _links: {
                requirements: "/api/services/1/requirements/",
              },
            },
            nestedResourceMethods: (name, url, options) => ({
              fetch: () => {},
              markDirty: () => {},
              reset: () => {},
            }),
            nestedResources: {
              requirements: {
                data: {
                  1: {
                    data: {
                      id: 1,
                      status: "REJECTED",
                      resource: 1,
                      amount: 100,
                    },
                  },
                },
                initialised: true,
              },
            },
          },
        },
        initialised: true,
        nestedResourceMethods: (name, url, options) => ({
          fetch: () => {},
          markDirty: () => {},
          reset: () => {},
        }),
      };

      if (name === "services") {
        return mockInstance;
      }
      if (name === "requirements") {
        return {
          data: {
            1: {
              data: {
                id: 1,
                status: "REJECTED",
                resource: 1,
                amount: 100,
              },
            },
          },
          initialised: true,
        };
      }
      return { data: {}, initialised: true };
    });

    // Mock current user as non-manager (ID 2)
    useCurrentUser.mockReturnValue({
      data: {
        id: 2,
        username: "testuser2",
        first_name: "Test",
        last_name: "User2",
        email: "test2@example.com",
      },
      fetchError: null,
      fetching: false,
      initialised: true,
    });

    // Keep consortium manager as ID 1
    useConsortia.mockReturnValue({
      ...mockConsortia,
      data: {
        1: {
          data: {
            ...mockConsortia.data[1].data,
            manager: { id: 1 },
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Route path="/projects/:id">
          <ProjectDetailWrapper />
        </Route>
      </MemoryRouter>
    );

    const servicesTab = screen.getByRole("link", { name: "Services" });
    fireEvent.click(servicesTab);

    await waitFor(() => {
      expect(screen.getByText(/Please/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /any rejected requirements before submitting your project for review./i
        )
      ).toBeInTheDocument();
    });
  });
});
