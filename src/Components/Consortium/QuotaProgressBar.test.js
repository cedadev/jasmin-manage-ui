// QuotaProgressBar.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuotaProgressBar } from "./QuotaProgressBar";
import renderer from "react-test-renderer";
import { act } from "react-dom/test-utils";

// Mock formatAmount utility
jest.mock("../utils", () => ({
  formatAmount: (value, units) => `${value}${units}`,
}));

describe("QuotaProgressBar Component", () => {
  const mockQuota = {
    data: {
      amount: 100,
      total_approved: 30,
      total_awaiting_provisioning: 20,
      total_provisioned: 10,
    },
  };

  const mockResource = {
    data: {
      units: "GB",
    },
  };

  const defaultProps = {
    quota: mockQuota,
    resource: mockResource,
    CaptionComponent: "div",
  };

  it("Should match the snapshot", () => {
    const component = renderer.create(<QuotaProgressBar {...defaultProps} />);
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("Should render basic progress bar without requirement", () => {
    render(<QuotaProgressBar {...defaultProps} />);

    // Check caption shows correct total
    expect(screen.getByText(/60GB of 100GB committed/)).toBeInTheDocument();
    expect(screen.getByText(/\(60%\)/)).toBeInTheDocument();

    // Verify all progress bar sections are present with correct values
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(4); // 3 status bars + 1 remaining

    // Verify individual progress bar sections
    const [provisioned, awaiting, approved, remaining] = progressBars;

    // Check provisioned section
    expect(provisioned).toHaveClass("bg-info");
    expect(provisioned).toHaveAttribute("aria-valuenow", "10");

    // Check awaiting section
    expect(awaiting).toHaveClass("bg-warning");
    expect(awaiting).toHaveAttribute("aria-valuenow", "20");

    // Check approved section
    expect(approved).toHaveClass("bg-success");
    expect(approved).toHaveAttribute("aria-valuenow", "30");

    // Check remaining section
    expect(remaining).toHaveClass("bg-transparent");
    expect(remaining).toHaveAttribute("aria-valuenow", "40");
  });

  it("Should handle APPROVED requirement correctly", () => {
    const requirement = {
      data: {
        amount: 20,
        status: "APPROVED",
      },
    };

    render(<QuotaProgressBar {...defaultProps} requirement={requirement} />);

    // Total committed should exclude requirement amount from approved
    expect(screen.getByText(/40GB of 100GB committed/)).toBeInTheDocument();
  });

  it("Should handle AWAITING_PROVISIONING requirement correctly", () => {
    const requirement = {
      data: {
        amount: 10,
        status: "AWAITING_PROVISIONING",
      },
    };

    render(<QuotaProgressBar {...defaultProps} requirement={requirement} />);

    // Total committed should exclude requirement amount from awaiting
    expect(screen.getByText(/50GB of 100GB committed/)).toBeInTheDocument();
  });

  it("Should handle PROVISIONED requirement correctly", () => {
    const requirement = {
      data: {
        amount: 5,
        status: "PROVISIONED",
      },
    };

    render(<QuotaProgressBar {...defaultProps} requirement={requirement} />);

    // Total committed should exclude requirement amount from provisioned
    expect(screen.getByText(/55GB of 100GB committed/)).toBeInTheDocument();
  });

  it("Should show quota indicator when total exceeds quota", () => {
    const largeQuota = {
      data: {
        amount: 50,
        total_approved: 60,
        total_awaiting_provisioning: 0,
        total_provisioned: 0,
      },
    };

    // Destructure container from render
    const { container } = render(
      <QuotaProgressBar {...defaultProps} quota={largeQuota} />
    );

    // Find quota-progress-bar div then find indicator line within it
    const progressBarDiv = container.querySelector(".quota-progress-bar");
    const indicatorLine = progressBarDiv.querySelector(".indicator-line");

    // Verify indicator exists and position
    expect(indicatorLine).toBeInTheDocument();
    expect(indicatorLine).toHaveStyle({
      left: "83.33333333333334%", // (50/60 * 100%)
    });
  });

  it("Should show tooltips on hover", async () => {
    const user = userEvent.setup();
    render(<QuotaProgressBar {...defaultProps} />);

    // Get all progress bars and find the provisioned one (first with bg-info class)
    const progressBars = screen.getAllByRole("progressbar");
    const provisionedBar = progressBars.find((bar) =>
      bar.classList.contains("bg-info")
    );

    // Hover over provisioned section
    await act(async () => {
      await user.hover(provisionedBar);
    });

    // Wait for tooltip
    await waitFor(() => {
      expect(screen.getByText(/Provisioned: 10GB/)).toBeInTheDocument();
    });

    // Unhover
    await act(async () => {
      await user.unhover(provisionedBar);
    });

    // Tooltip should disappear
    await waitFor(() => {
      expect(screen.queryByText(/Provisioned: 10GB/)).not.toBeInTheDocument();
    });
  });

  it("Should show remaining amount when less than quota", () => {
    const smallQuota = {
      data: {
        amount: 100,
        total_approved: 20,
        total_awaiting_provisioning: 10,
        total_provisioned: 10,
      },
    };

    render(<QuotaProgressBar {...defaultProps} quota={smallQuota} />);

    // Should show remaining bar
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars).toHaveLength(4); // 3 status + 1 remaining
  });

  it("Should show and hide tooltip on indicator line hover", async () => {
    const largeQuota = {
      data: {
        amount: 50,
        total_approved: 60,
        total_awaiting_provisioning: 0,
        total_provisioned: 0,
      },
    };

    const { container } = render(
      <QuotaProgressBar {...defaultProps} quota={largeQuota} />
    );

    // Find indicator line
    const progressBarDiv = container.querySelector(".quota-progress-bar");
    const indicatorLine = progressBarDiv.querySelector(".indicator-line");
    expect(indicatorLine).toBeInTheDocument();

    const user = userEvent.setup();

    // Mouse enter - show tooltip
    await act(async () => {
      await user.hover(indicatorLine);
    });
    expect(screen.getByText(/Quota amount: 50GB/)).toBeInTheDocument();

    // Mouse leave - hide tooltip
    await act(async () => {
      await user.unhover(indicatorLine);
    });
    await waitFor(() => {
      expect(screen.queryByText(/Quota amount: 50GB/)).not.toBeInTheDocument();
    });
  });
});
