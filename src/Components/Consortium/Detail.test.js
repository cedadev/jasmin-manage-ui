import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter as Router } from "react-router-dom";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import { useNotifications } from "react-bootstrap-notify";
import ConsortiumDetailWrapper from "./Detail";
import {
  useConsortia,
  useConsortium,
  useConsortiumSummary,
  useCurrentUser,
  useResources,
} from "../../api";
import { notificationFromError } from "../utils";
import { useNestedResource } from "../../rest-resource";
import { MemoryRouter, Route } from "react-router-dom/cjs/react-router-dom.min";

jest.mock("react-bootstrap-notify");

const renderConDetail = () => {
  return render(
    <Router>
      <ConsortiumDetailWrapper />
    </Router>
  );
};

const renderConDetailWithMemRouter = () => {
  return render(
    <MemoryRouter initialEntries={["/consortia/1"]}>
      <Route path="/consortia/:id">
        <ConsortiumDetailWrapper />
      </Route>
    </MemoryRouter>
  );
};

const renderConDetailWithMemRouterAndPath = (path) => {
  render(
    <MemoryRouter initialEntries={["/consortia/1"]}>
      <Route path="/consortia/:id">
        <ConsortiumDetailWrapper />
      </Route>
      <Route path="/consortia">
        <div>Consortia List Page</div>
      </Route>
    </MemoryRouter>
  );
};

// Mock the API hooks
jest.mock("../../api", () => ({
  useConsortia: jest.fn(),
  useConsortium: jest.fn(),
  useConsortiumSummary: jest.fn(),
  useResources: jest.fn(),
  useCurrentUser: jest.fn(),
  notifyMock: jest.fn(),
}));

// Mock the rest-resource hooks
jest.mock("../../rest-resource", () => ({
  ...jest.requireActual("../../rest-resource"),
  useNestedResource: jest.fn(),
}));

const mockConsortium = {
  data: {
    id: 1,
    name: "Test Consortium",
    description: "This is a test consortium",
    is_public: true,
    manager: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      username: "johndoe",
    },
    num_projects: 5,
    num_projects_current_user: 2,
  },
  fetchError: null,
  fetching: false,
  initialised: true,
  nestedResources: {},
  nestedResourceMethods: jest.fn(),
};

const mockConsortiumSummary = {
  data: {
    project_summaries: [
      {
        project_name: "Project A",
        tags: ["Tag1", "Tag2"],
        collaborators: [{ username: "user1" }, { username: "user2" }],
        resource_summary: {
          Resource_A: 10,
          Resource_B: 20,
        },
      },
    ],
  },
  fetchError: null,
  fetching: false,
  initialised: true,
};

const mockResources = (resource, name) => {
  if (name === "projects") {
    return {
      data: {
        1: {
          data: {
            id: 1,
            name: "Project A",
            description: "Description of Project A",
            num_services: 2,
            num_requirements: 3,
            num_collaborators: 2,
            status: "ACTIVE",
          },
        },
        2: {
          data: {
            id: 2,
            name: "Project B",
            description: "Description of Project B",
            num_services: 1,
            num_requirements: 2,
            num_collaborators: 1,
            status: "ACTIVE",
          },
        },
      },
      fetchError: null,
      fetching: false,
      initialised: true,
    };
  } else if (name === "collaborators") {
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
              email: "test@example.com",
            },
            role: "OWNER",
          },
        },
      },
      fetchError: null,
      fetching: false,
      initialised: true,
    };
  } else if (name === "tags") {
    return {
      data: {
        1: {
          data: {
            id: 1,
            name: "Tag1",
          },
        },
        2: {
          data: {
            id: 2,
            name: "Tag2",
          },
        },
      },
      fetchError: null,
      fetching: false,
      initialised: true,
    };
  } else if (name === "collaborators") {
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
              email: "test@example.com",
            },
            role: "OWNER",
          },
        },
      },
      fetchError: null,
      fetching: false,
      initialised: true,
    };
  } else if (name === "quotas") {
    return {
      data: {
        1: {
          data: {
            id: 1,
            resource: 1,
            amount: 100,
            total_approved: 50,
            total_awaiting_provisioning: 20,
            total_provisioned: 30,
          },
        },
        2: {
          data: {
            id: 2,
            resource: 2,
            amount: 200,
            total_approved: 150,
            total_awaiting_provisioning: 30,
            total_provisioned: 20,
          },
        },
      },
      fetchError: null,
      fetching: false,
      initialised: true,
    };
  } else {
    return {
      data: null,
      fetchError: null,
      fetching: false,
      initialised: true,
    };
  }
};

useResources.mockReturnValue({
  initialised: true,
  fetching: false,
  fetchError: null,
  data: {
    1: { data: { id: 1, name: "Resource A", units: "GB" } },
    2: { data: { id: 2, name: "Resource B", units: "TB" } },
  },
});

describe("Testing content has loading on Consortium Detail Page", () => {
  beforeEach(() => {
    useCurrentUser.mockReturnValue({
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
    });
    useConsortia.mockReturnValue({
      data: { 1: mockConsortium },
      fetchError: null,
      fetching: false,
      initialised: true,
    });
    useConsortium.mockReturnValue(mockConsortium);
    useConsortiumSummary.mockReturnValue(mockConsortiumSummary);

    useNestedResource.mockImplementation(mockResources);
  });

  it("matches the snapshot", () => {
    const component = renderer.create(
      <Router>
        <ConsortiumDetailWrapper />
      </Router>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("displays the consortium name", async () => {
    renderConDetail();

    // Wait for the consortium name to be displayed
    await waitFor(() => {
      expect(screen.getByText("Test Consortium")).toBeInTheDocument();
    });
  });

  it("displays the public status when the consortium is public", async () => {
    renderConDetail();

    // Wait for the public badge to be displayed
    await waitFor(() => {
      expect(screen.getByText("Public")).toBeInTheDocument();
    });
  });

  it("displays the not public status when the consortium is not public", async () => {
    // Modify the mock to set is_public to false
    const mockConsortiumNotPublic = {
      ...mockConsortium,
      data: {
        ...mockConsortium.data,
        is_public: false,
      },
    };
    useConsortium.mockReturnValue(mockConsortiumNotPublic);

    renderConDetail();

    // Wait for the not public badge to be displayed
    await waitFor(() => {
      expect(screen.getByText("Not Public")).toBeInTheDocument();
    });
  });

  it("displays correct project status when not ACTIVE", async () => {
    // Modify the mock data to test different project statuses
    const mockResourcesWithDifferentStatus = (resource, name) => {
      if (name === "projects") {
        return {
          data: {
            1: {
              data: {
                id: 1,
                name: "Project A",
                description: "Description of Project A",
                num_services: 2,
                num_requirements: 3,
                num_collaborators: 2,
                status: "UNDER_REVIEW",
              },
            },
            2: {
              data: {
                id: 2,
                name: "Project B",
                description: "Description of Project B",
                num_services: 1,
                num_requirements: 2,
                num_collaborators: 1,
                status: "COMPLETED",
              },
            },
            3: {
              data: {
                id: 3,
                name: "Project C",
                description: "Description of Project C",
                num_services: 1,
                num_requirements: 2,
                num_collaborators: 1,
                status: "EDITABLE",
              },
            },
          },
          fetchError: null,
          fetching: false,
          initialised: true,
        };
      } else if (name === "quotas") {
        return {
          data: {
            1: {
              data: {
                id: 1,
                resource: 1,
                amount: 100,
                total_approved: 50,
                total_awaiting_provisioning: 20,
                total_provisioned: 30,
              },
            },
            2: {
              data: {
                id: 2,
                resource: 2,
                amount: 200,
                total_approved: 150,
                total_awaiting_provisioning: 30,
                total_provisioned: 20,
              },
            },
          },
          fetchError: null,
          fetching: false,
          initialised: true,
        };
      } else if (name === "tags") {
        return {
          data: {
            1: {
              data: {
                id: 1,
                name: "Tag1",
              },
            },
            2: {
              data: {
                id: 2,
                name: "Tag2",
              },
            },
          },
          fetchError: null,
          fetching: false,
          initialised: true,
        };
      }
      return {
        data: {},
        fetchError: null,
        fetching: false,
        initialised: true,
      };
    };

    // Use the modified mock
    useNestedResource.mockImplementation(mockResourcesWithDifferentStatus);

    renderConDetailWithMemRouter();

    // Wait for and click the Projects tab
    await waitFor(() => {
      expect(screen.getByText("Projects")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Projects"));

    // Find all project cards
    const projectAHeader = screen.getByText("Project A");
    const projectACard = projectAHeader.closest(".card");
    const projectBHeader = screen.getByText("Project B");
    const projectBCard = projectBHeader.closest(".card");
    const projectCHeader = screen.getByText("Project C");
    const projectCCard = projectCHeader.closest(".card");

    // Ensure we found all cards
    expect(projectACard).toBeInTheDocument();
    expect(projectBCard).toBeInTheDocument();
    expect(projectCCard).toBeInTheDocument();

    // Check Project A status (UNDER_REVIEW)
    const withinProjectA = within(projectACard);
    expect(withinProjectA.getByText(/Project is/)).toBeInTheDocument();
    expect(withinProjectA.getByText(/UNDER_REVIEW/)).toBeInTheDocument();

    // Check Project B status (COMPLETED)
    const withinProjectB = within(projectBCard);
    expect(withinProjectB.getByText(/Project is/)).toBeInTheDocument();
    expect(withinProjectB.getByText(/COMPLETED/)).toBeInTheDocument();

    // Check Project C status (EDITABLE)
    const withinProjectC = within(projectCCard);
    expect(withinProjectC.getByText(/Project is/)).toBeInTheDocument();
    expect(withinProjectC.getByText(/EDITABLE/)).toBeInTheDocument();
  });
});

describe("Testing functionality of the Consortium Detail Page", () => {
  beforeEach(() => {
    useCurrentUser.mockReturnValue({
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
    });
    useConsortia.mockReturnValue({
      data: { 1: mockConsortium },
      fetchError: null,
      fetching: false,
      initialised: true,
    });
    useConsortium.mockReturnValue(mockConsortium);
    useConsortiumSummary.mockReturnValue(mockConsortiumSummary);

    useNestedResource.mockImplementation(mockResources);
  });

  it("redirects and notifies when projects.fetchError occurs", async () => {
    const notifyMock = jest.fn();
    useNotifications.mockReturnValue(notifyMock);

    // Mock the consortium data
    useConsortium.mockReturnValue({
      data: mockConsortium,
      fetchError: null,
      fetching: false,
      initialised: true,
    });

    // Mock the projects to have a fetchError
    useNestedResource.mockImplementation((parent, resourceType) => {
      if (resourceType === "projects") {
        return {
          data: {},
          fetchError: new Error("Failed to fetch projects"),
          fetching: false,
          initialised: true,
        };
      } else if (resourceType === "quotas") {
        // Return normal quotas data
        return {
          data: {},
          fetchError: null,
          fetching: false,
          initialised: true,
        };
      }
      return {
        data: {},
        fetchError: null,
        fetching: false,
        initialised: true,
      };
    });

    renderConDetailWithMemRouterAndPath();

    // Verify that notify was called with the error message
    expect(notifyMock).toHaveBeenCalledWith(
      notificationFromError(new Error("Failed to fetch projects"))
    );

    // Verify that the user is redirected to /consortia
    await waitFor(() => {
      expect(screen.getByText("Consortia List Page")).toBeInTheDocument();
    });
  });

  it("redirects and notifies when quotas.fetchError occurs", async () => {
    const notifyMock = jest.fn();
    useNotifications.mockReturnValue(notifyMock);

    // Mock the consortium data
    useConsortium.mockReturnValue({
      data: mockConsortium,
      fetchError: null,
      fetching: false,
      initialised: true,
    });

    // Mock the quotas to have a fetchError
    useNestedResource.mockImplementation((parent, resourceType) => {
      if (resourceType === "quotas") {
        return {
          data: {},
          fetchError: new Error("Failed to fetch quotas"),
          fetching: false,
          initialised: true,
        };
      } else if (resourceType === "projects") {
        // Return normal projects data
        return {
          data: {},
          fetchError: null,
          fetching: false,
          initialised: true,
        };
      }
      return {
        data: {},
        fetchError: null,
        fetching: false,
        initialised: true,
      };
    });

    renderConDetailWithMemRouterAndPath();

    // Verify that notify was called with the error message
    expect(notifyMock).toHaveBeenCalledWith(
      notificationFromError(new Error("Failed to fetch quotas"))
    );

    // Verify that the user is redirected to /consortia
    await waitFor(() => {
      expect(screen.getByText("Consortia List Page")).toBeInTheDocument();
    });
  });

  it("notifies when consortium.fetchError occurs", async () => {
    const notifyMock = jest.fn();
    useNotifications.mockReturnValue(notifyMock);

    // Mock the consortia data with initial data to prevent null access
    useConsortia.mockReturnValue({
      data: {
        1: {
          data: {
            id: 1,
            name: "Test Consortium",
            is_public: true,
          },
        },
      },
      fetchError: null,
      fetching: false,
      initialised: true,
    });

    // Mock the consortium with initial data but with fetchError
    useConsortium.mockReturnValue({
      data: {
        id: 1,
        name: "Test Consortium",
        is_public: true,
      },
      fetchError: new Error("Failed to fetch consortium"),
      fetching: false,
      initialised: true,
    });

    // Mock consortium summary
    useConsortiumSummary.mockReturnValue({
      data: {},
      fetchError: null,
      fetching: false,
      initialised: true,
    });

    render(
      <MemoryRouter initialEntries={["/consortia/1"]}>
        <Route path="/consortia/:id">
          <ConsortiumDetailWrapper />
        </Route>
        <Route path="/consortia">
          <div>Consortia List Page</div>
        </Route>
      </MemoryRouter>
    );

    // Wait for asynchronous effects to complete
    await waitFor(() => {
      // Verify that notify was called with the error message
      expect(notifyMock).toHaveBeenCalledWith(
        notificationFromError(new Error("Failed to fetch consortium"))
      );
      // Verify that the user is redirected to /consortia
      expect(screen.getByText("Consortia List Page")).toBeInTheDocument();
    });
  });
});
