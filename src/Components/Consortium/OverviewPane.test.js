import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import renderer from "react-test-renderer";
import { BrowserRouter as Router } from "react-router-dom";

import OverviewPane from "./OverviewPane";
import { useResources } from "../../api";

// Mock the API hooks
jest.mock("../../api");

// Helper function to render the component
const renderOverviewPane = (quotas) => {
  return render(
    <Router>
      <OverviewPane quotas={quotas} />
    </Router>
  );
};

describe("OverviewPane Component", () => {
  // Mock data for resources
  const mockResources = {
    data: {
      1: {
        data: {
          id: 1,
          name: "Resource A",
          units: "GB",
        },
      },
      2: {
        data: {
          id: 2,
          name: "Resource B",
          units: "TB",
        },
      },
    },
  };

  // Mock data for quotas
  const mockQuotas = {
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
  };

  beforeEach(() => {
    useResources.mockReturnValue(mockResources);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should match the snapshot", () => {
    const component = renderer.create(
      <Router>
        <OverviewPane quotas={mockQuotas} />
      </Router>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("Should display loading state when fetching", async () => {
    useResources.mockReturnValue({
      data: null,
      fetching: true,
      initialised: false,
    });

    renderOverviewPane(mockQuotas);
    expect(screen.getByText("Loading quotas...")).toBeInTheDocument();
  });

  it("Should display quota cards with correct information", async () => {
    // Mock resources with initialized state
    useResources.mockReturnValue({
      data: mockResources.data,
      fetching: false,
      fetchError: null,
      initialised: true,
    });

    // Mock quotas with initialized state
    const quotas = {
      data: mockQuotas.data,
      fetching: false,
      fetchError: null,
      initialised: true,
    };

    renderOverviewPane(quotas);

    // Wait for the component to render and verify content
    await waitFor(() => {
      // Check for resource names
      expect(screen.getByText("Resource A")).toBeInTheDocument();
    });

    // Now check the rest of the quota information
    const quotaCardA = screen.getByText("Resource A").closest(".card");
    const quotaCardB = screen.getByText("Resource B").closest(".card");

    // Check quota card A content
    within(quotaCardA).getByText("100 GB"); // Quota amount
    within(quotaCardA).getByText("30 GB"); // Total Provisioned
    within(quotaCardA).getByText("20 GB"); // Total Awaiting Provisioning
    within(quotaCardA).getByText("50 GB"); // Total Approved

    // Check quota card B content
    within(quotaCardB).getByText("200 TB"); // Quota amount
    within(quotaCardB).getByText("20 TB"); // Total Provisioned
    within(quotaCardB).getByText("30 TB"); // Total Awaiting Provisioning
    within(quotaCardB).getByText("150 TB"); // Total Approved
  });

  it("Should display warning border for quotas between 70% and 90% usage", async () => {
    useResources.mockReturnValue({
      data: {
        1: {
          data: {
            id: 1,
            name: "Resource A",
            units: "GB",
          },
        },
      },
      fetching: false,
      fetchError: null,
      initialised: true,
    });

    const warningQuotas = {
      data: {
        1: {
          data: {
            id: 1,
            resource: 1,
            amount: 100,
            total_approved: 60,
            total_awaiting_provisioning: 10,
            total_provisioned: 5,
          },
        },
      },
      fetching: false,
      fetchError: null,
      initialised: true,
    };

    renderOverviewPane(warningQuotas);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading quotas...")).not.toBeInTheDocument();
    });

    // Find card by heading and verify border class
    const quotaCard = screen
      .getByRole("heading", { name: "Resource A" })
      .closest(".card");
    expect(quotaCard).toHaveClass("quota-card", "border-warning");

    // Verify percentage is correct
    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });

  it("Should display danger border for quotas above 90% usage", async () => {
    // Mock resources with the required resource for the test
    useResources.mockReturnValue({
      data: {
        1: {
          data: {
            id: 1,
            name: "Resource A",
            units: "GB",
          },
        },
      },
      initialised: true,
      fetching: false,
    });

    const dangerQuotas = {
      data: {
        1: {
          data: {
            id: 1,
            resource: 1,
            amount: 100,
            total_approved: 80,
            total_awaiting_provisioning: 10,
            total_provisioned: 5,
          },
        },
      },
      initialised: true,
      fetching: false,
    };

    renderOverviewPane(dangerQuotas);

    // Wait for the component to render and check for quota card
    await waitFor(() => {
      expect(screen.getByText("Resource A")).toBeInTheDocument();
    });

    const quotaCard = screen.getByText("Resource A").closest(".quota-card");
    expect(quotaCard).toHaveClass("border-danger");
  });
});
