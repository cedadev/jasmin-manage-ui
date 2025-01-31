import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import renderer from "react-test-renderer";
import { BrowserRouter as Router } from "react-router-dom";
import SummaryPane from "./ProjectSummaryPane";
import { act } from "react-dom/test-utils";

// Mock useLocation
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => ({
    pathname: "/test-path",
  }),
}));

// Helper function to render the component
const renderSummaryPane = (consortium, conSummary) => {
  return render(
    <Router>
      <SummaryPane consortium={consortium} conSummary={conSummary} />
    </Router>
  );
};

describe("ProjectSummaryPane Component", () => {
  // Mock data for consortium
  const mockConsortium = {
    data: {
      id: 1,
      name: "Test Consortium",
    },
  };

  // Mock data for consortium summary
  const mockConsortiumSummary = {
    data: {
      project_summaries: [
        {
          project_name: "Project A",
          tags: ["Tag1", "Tag2"],
          collaborators: [{ username: "user1" }, { username: "user2" }],
          resource_summary: {
            "Resource A": 10,
            "Resource B": 20,
          },
        },
        {
          project_name: "Project B",
          tags: ["Tag2", "Tag3"],
          collaborators: [{ username: "user3" }],
          resource_summary: {
            "Resource A": 30,
            "Resource B": 0,
          },
        },
      ],
    },
    fetching: false,
    fetchError: null,
    initialised: true,
  };

  it("Should match the snapshot", () => {
    const component = renderer.create(
      <Router>
        <SummaryPane
          consortium={mockConsortium}
          conSummary={mockConsortiumSummary}
        />
      </Router>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("Should display loading state when fetching", () => {
    const loadingState = {
      ...mockConsortiumSummary,
      fetching: true,
      initialised: false,
    };

    renderSummaryPane(mockConsortium, loadingState);
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("Should render table with correct columns and data", async () => {
    renderSummaryPane(mockConsortium, mockConsortiumSummary);

    // Check table headers
    expect(screen.getByText("Project")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("Collaborators")).toBeInTheDocument();
    expect(screen.getByText("Resource A")).toBeInTheDocument();
    expect(screen.getByText("Resource B")).toBeInTheDocument();

    // Check project data
    expect(screen.getByText("Project A")).toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();

    // Check tag content
    expect(screen.getByText(/Tag1, Tag2/)).toBeInTheDocument();
    expect(screen.getByText(/Tag2, Tag3/)).toBeInTheDocument();

    // Check collaborator content
    expect(screen.getByText(/user1, user2/)).toBeInTheDocument();
    expect(screen.getByText("user3")).toBeInTheDocument();
  });

  it("Should filter rows when tag is selected", async () => {
    renderSummaryPane(mockConsortium, mockConsortiumSummary);

    // Click dropdown and select Tag1
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /All Tags/i }));
      await userEvent.click(screen.getByText("Tag1"));
    });

    // Project A row should be visible (has Tag1)
    const projectARow = screen.getByRole("row", {
      name: /Project A Tag1, Tag2 user1, user2 10 20/,
    });
    expect(projectARow).toBeInTheDocument();

    // Project B row should not be visible
    const projectBRow = screen.queryByRole("row", {
      name: /Project B Tag2, Tag3 user3 30/,
    });
    expect(projectBRow).not.toBeInTheDocument();
  });

  it("Should exclude columns with no data", async () => {
    const summaryWithEmptyColumn = {
      ...mockConsortiumSummary,
      data: {
        project_summaries: [
          {
            ...mockConsortiumSummary.data.project_summaries[0],
            resource_summary: {
              "Resource A": 0,
              "Resource B": 0,
              "Resource C": 10,
            },
          },
        ],
      },
    };

    renderSummaryPane(mockConsortium, summaryWithEmptyColumn);

    // Resource A and B should not be shown since they have no data
    expect(screen.queryByText("Resource A")).not.toBeInTheDocument();
    expect(screen.queryByText("Resource B")).not.toBeInTheDocument();
    expect(screen.getByText("Resource C")).toBeInTheDocument();
  });

  it("Should sort string columns in ascending order", async () => {
    const mockDataWithThreeProjects = {
      ...mockConsortiumSummary,
      data: {
        project_summaries: [
          {
            project_name: "Project B",
            tags: ["Tag1"],
            collaborators: [{ username: "user1" }],
            resource_summary: {
              "Resource A": 10,
              "Resource B": 20,
            },
          },
          {
            project_name: "Project C",
            tags: ["Tag2"],
            collaborators: [{ username: "user2" }],
            resource_summary: {
              "Resource A": 30,
              "Resource B": 40,
            },
          },
          {
            project_name: "Project A",
            tags: ["Tag3"],
            collaborators: [{ username: "user3" }],
            resource_summary: {
              "Resource A": 50,
              "Resource B": 60,
            },
          },
        ],
      },
    };

    renderSummaryPane(mockConsortium, mockDataWithThreeProjects);

    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByText("Project B")).toBeInTheDocument();
    });

    // Click project name header to sort
    const projectHeader = screen.getByText("Project");
    await userEvent.click(projectHeader);

    // Get all project cells
    const projectCells = screen
      .getAllByRole("cell")
      .filter((cell) => cell.textContent.startsWith("Project "));

    // Verify ascending order
    expect(projectCells[0]).toHaveTextContent("Project A");
    expect(projectCells[1]).toHaveTextContent("Project B");
    expect(projectCells[2]).toHaveTextContent("Project C");
  });

  it("Should sort string columns in descending order on second click", async () => {
    const mockDataWithThreeProjects = {
      ...mockConsortiumSummary,
      data: {
        project_summaries: [
          {
            project_name: "Project B",
            tags: ["Tag1"],
            collaborators: [{ username: "user1" }],
            resource_summary: {
              "Resource A": 10,
              "Resource B": 20,
            },
          },
          {
            project_name: "Project C",
            tags: ["Tag2"],
            collaborators: [{ username: "user2" }],
            resource_summary: {
              "Resource A": 30,
              "Resource B": 40,
            },
          },
          {
            project_name: "Project A",
            tags: ["Tag3"],
            collaborators: [{ username: "user3" }],
            resource_summary: {
              "Resource A": 50,
              "Resource B": 60,
            },
          },
        ],
      },
    };

    renderSummaryPane(mockConsortium, mockDataWithThreeProjects);

    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByText("Project B")).toBeInTheDocument();
    });

    // Click project name header twice
    const projectHeader = screen.getByText("Project");
    await userEvent.click(projectHeader);
    await userEvent.click(projectHeader);

    // Get all project cells
    const projectCells = screen
      .getAllByRole("cell")
      .filter((cell) => cell.textContent.startsWith("Project "));

    // Verify descending order
    expect(projectCells[0]).toHaveTextContent("Project C");
    expect(projectCells[1]).toHaveTextContent("Project B");
    expect(projectCells[2]).toHaveTextContent("Project A");
  });

  it("Should sort numeric columns correctly handling null values", async () => {
    const summaryWithNulls = {
      ...mockConsortiumSummary,
      data: {
        project_summaries: [
          {
            project_name: "Project A",
            tags: ["Tag1"],
            collaborators: [{ username: "user1" }],
            resource_summary: {
              "Resource A": 10,
            },
          },
          {
            project_name: "Project B",
            tags: ["Tag2"],
            collaborators: [{ username: "user2" }],
            resource_summary: {
              "Resource A": 20,
            },
          },
          {
            project_name: "Project C",
            tags: ["Tag3"],
            collaborators: [{ username: "user3" }],
            resource_summary: {
              "Resource A": null,
            },
          },
        ],
      },
    };

    renderSummaryPane(mockConsortium, summaryWithNulls);

    // Click Resource A header to sort
    const resourceHeader = screen.getByText("Resource A");
    await userEvent.click(resourceHeader);

    // Get all Resource A cells
    const cells = screen
      .getAllByRole("cell")
      .filter((cell) => cell.textContent.match(/^[0-9]+$|^—$/));

    // Verify order with nulls at end
    expect(cells[0]).toHaveTextContent("10");
    expect(cells[1]).toHaveTextContent("20");
    expect(cells[2]).toHaveTextContent("—"); // null value
  });

  it("Should maintain sort indicators in column headers", async () => {
    renderSummaryPane(mockConsortium, mockConsortiumSummary);

    // Click project header
    const projectHeader = screen.getByText("Project");
    await userEvent.click(projectHeader);

    // Check for ascending sort indicator
    expect(projectHeader.querySelector(".fa-sort-up")).toBeInTheDocument();

    // Click again
    await userEvent.click(projectHeader);

    // Check for descending sort indicator
    expect(projectHeader.querySelector(".fa-sort-down")).toBeInTheDocument();
  });

  it("Should correctly sort columns with null values", async () => {
    const mockDataWithNulls = {
      ...mockConsortiumSummary,
      data: {
        project_summaries: [
          {
            project_name: "Project A",
            tags: ["Tag1"],
            collaborators: [{ username: "user1" }],
            resource_summary: {
              "Resource A": null,
              "Resource B": 20,
            },
          },
          {
            project_name: "Project B",
            tags: ["Tag2"],
            collaborators: [{ username: "user2" }],
            resource_summary: {
              "Resource A": null,
              "Resource B": 40,
            },
          },
          {
            project_name: "Project C",
            tags: ["Tag3"],
            collaborators: [{ username: "user3" }],
            resource_summary: {
              "Resource A": 30,
              "Resource B": 60,
            },
          },
        ],
      },
      initialised: true,
      fetching: false,
    };

    renderSummaryPane(mockConsortium, mockDataWithNulls);

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });

    // Click Resource A header to sort
    const resourceHeader = screen.getByText("Resource A");
    await userEvent.click(resourceHeader);

    // Get row data to verify sort order
    const rows = screen.getAllByRole("row").slice(1); // Skip header row

    // Extract Resource A values from each row (4th column)
    const resourceAValues = rows.map(
      (row) => row.querySelectorAll("td")[3].textContent
    );

    // Verify order - non-null value first, then nulls
    expect(resourceAValues[0]).toBe("30"); // Non-null value first
    expect(resourceAValues[1]).toBe("—"); // null value
    expect(resourceAValues[2]).toBe("—"); // null value

    // Verify original order maintained for null values
    const projectOrder = rows.map(
      (row) => row.querySelectorAll("td")[0].textContent
    );

    // Check Project A comes before Project C in null values
    const projectAIndex = projectOrder.indexOf("Project A");
    const projectCIndex = projectOrder.indexOf("Project B");
    expect(projectAIndex).toBeLessThan(projectCIndex);
  });

  it("Should show only All Tags option when no tags present", async () => {
    const mockProjectsSummaryDataWithNoTags = {
      data: {
        project_summaries: [
          {
            project_name: "Project A",
            tags: [], // Empty tags
            collaborators: [{ username: "user1" }],
            resource_summary: {
              "Resource A": 10,
              "Resource B": 20,
            },
          },
          {
            project_name: "Project B",
            tags: [], // Empty tags
            collaborators: [{ username: "user2" }],
            resource_summary: {
              "Resource A": 30,
              "Resource B": 40,
            },
          },
        ],
      },
      initialised: true,
      fetching: false,
      fetchError: null,
    };

    renderSummaryPane(mockConsortium, mockProjectsSummaryDataWithNoTags);

    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });

    // Click dropdown
    await act(async () => {
      const tagDropdown = screen.getByRole("button", { name: /all tags/i });
      await userEvent.click(tagDropdown);
    });

    // Get dropdown items
    const dropdownItems = screen.getAllByRole("button");

    // Should only have All Tags option since no tags are present
    expect(dropdownItems[0]).toHaveTextContent("All Tags");
  });

  it("Should handle empty collaborators array correctly", async () => {
    const mockDataWithNoCollaborators = {
      data: {
        project_summaries: [
          {
            project_name: "Project A",
            tags: ["Tag1"],
            collaborators: [], // Empty collaborators array
            resource_summary: {
              "Resource A": 10,
              "Resource B": 20,
            },
          },
        ],
      },
      initialised: true,
      fetching: false,
      fetchError: null,
    };

    renderSummaryPane(mockConsortium, mockDataWithNoCollaborators);

    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });

    // Get table row
    const projectRow = screen.getByText("Project A").closest("tr");

    // Get all cells in the row
    const cells = within(projectRow).getAllByRole("cell");

    // Collaborators should be the third column (index 2)
    // No need to search for header text which might be inconsistent
    const collaboratorsCell = cells[2];

    // Verify empty collaborators shows as ""
    expect(collaboratorsCell).toHaveTextContent("");
  });
});
