import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter as Router } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import TagPage from "./List";
import {
  useProjectsSummary,
  useResources,
  useTags,
  useConsortia,
} from "../../api";

// Mock data to be used in the dropdowns
const tagDropDownData = ["TagOpt1", "TagOpt2", "TagOpt3"];
const conDropDownData = ["ConOpt1", "ConOpt2", "ConOpt3"];

// Mock the API hooks
jest.mock("../../api", () => ({
  useProjectsSummary: jest.fn(),
  useResources: jest.fn(),
  useTags: jest.fn(),
  useConsortia: jest.fn(),
}));

const renderTagPage = () => {
  return render(
    <Router>
      <TagPage />
    </Router>
  );
};

describe("TagPage Component", () => {
  // Mock data for projects summary
  const mockProjectsSummaryData = {
    initialised: true,
    fetching: false,
    fetchError: null,
    data: {
      1: {
        data: {
          name: "Project A",
          consortium: "ConOpt1",
          tags: ["TagOpt1"],
          resource_summary: {
            Resource_A: 10,
            Resource_B: 20,
          },
        },
      },
      2: {
        data: {
          name: "Project B",
          consortium: "ConOpt2",
          tags: ["TagOpt2"],
          resource_summary: {
            Resource_A: 15,
            Resource_B: 25,
          },
        },
      },
      3: {
        data: {
          name: "Project C",
          consortium: "ConOpt3",
          tags: ["TagOpt3"],
          resource_summary: {
            Resource_A: 5,
            Resource_B: 30,
          },
        },
      },
    },
  };

  beforeEach(() => {
    // Mock the return values of the hooks
    useProjectsSummary.mockReturnValue(mockProjectsSummaryData);
    useResources.mockReturnValue({
      initialised: true,
      fetching: false,
      fetchError: null,
      data: {
        Resource_A: { data: { name: "Resource A" } },
        Resource_B: { data: { name: "Resource B" } },
      },
    });
    useTags.mockReturnValue({
      initialised: true,
      fetching: false,
      fetchError: null,
      data: {
        TagOpt1: { data: { name: "TagOpt1" } },
        TagOpt2: { data: { name: "TagOpt2" } },
        TagOpt3: { data: { name: "TagOpt3" } },
      },
    });
    useConsortia.mockReturnValue({
      initialised: true,
      fetching: false,
      fetchError: null,
      data: {
        ConOpt1: { data: { name: "ConOpt1" } },
        ConOpt2: { data: { name: "ConOpt2" } },
        ConOpt3: { data: { name: "ConOpt3" } },
      },
    });
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  // Snapshot test
  it("Should match the snapshot", () => {
    const component = renderer.create(
      <Router>
        <TagPage />
      </Router>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  // Test for rendering page title and content
  it("Should render the page title and content correctly", () => {
    renderTagPage();

    // Check for page title
    expect(screen.getByText("Projects List")).toBeVisible();

    // Check for descriptive text
    expect(
      screen.getByText(
        "View of all projects, including filters for tags and consortia. Some columns can be sorted."
      )
    ).toBeVisible();

    // Check for dropdowns
    expect(screen.getByText("All Tags")).toBeVisible();
    expect(screen.getByText("All Consortia")).toBeVisible();

    // Check for table headers
    const headers = ["Project", "Consortium", "Tags"];
    headers.forEach((header) => {
      expect(screen.getByText(header)).toBeVisible();
    });
  });

  // Test for All Tags dropdown functionality
  it("Should render the 'All Tags' dropdowns correctly", async () => {
    renderTagPage();

    const user = userEvent.setup();

    // "All Tags" dropdown
    const tagDropdownButton = screen.getByRole("button", {
      name: /all tags/i,
    });
    expect(tagDropdownButton).toBeInTheDocument();

    // Click on "All Tags" dropdown
    await act(async () => {
      await user.click(tagDropdownButton);
    });

    // Verify all tag options are present
    const tagDropdownMenu = document.querySelector(".dropdown-menu.show");
    expect(tagDropdownMenu).toBeInTheDocument();

    tagDropDownData.forEach((tag) => {
      expect(within(tagDropdownMenu).getByText(tag)).toBeInTheDocument();
    });

    // Select "TagOpt1"
    const tagOption = within(tagDropdownMenu).getByText("TagOpt1");
    await act(async () => {
      await user.click(tagOption);
    });

    expect(tagDropdownButton).toHaveTextContent("TagOpt1");
  });

  // Test for 'All Consortium' dropdown functionality
  it("Should render the 'All Consortium' dropdowns correctly", async () => {
    renderTagPage();

    const user = userEvent.setup();

    // "All Consortia" dropdown
    const conDropdownButton = screen.getByRole("button", {
      name: /all consortia/i,
    });
    expect(conDropdownButton).toBeInTheDocument();

    // Click on "All Consortia" dropdown
    await act(async () => {
      await user.click(conDropdownButton);
    });

    // Verify all tag options are present
    const conDropdownMenu = document.querySelector(".dropdown-menu.show");
    expect(conDropdownMenu).toBeInTheDocument();

    conDropDownData.forEach((con) => {
      expect(within(conDropdownMenu).getByText(con)).toBeInTheDocument();
    });

    // Select "TagOpt1"
    const conOption = within(conDropdownMenu).getByText("ConOpt1");
    await user.click(conOption);

    expect(conDropdownButton).toHaveTextContent("ConOpt1");
  });

  // Test for sorting functionality
  it("Should sort the table columns correctly", async () => {
    renderTagPage();

    const user = userEvent.setup();

    // Helper function to get table rows excluding the header
    const getTableRows = () => {
      const allRows = screen.getAllByRole("row");
      // Assuming the first row is the header
      return allRows.slice(1);
    };

    // Sort by "Project" column (Ascending)
    const projectHeader = screen.getByText("Project");
    await act(async () => {
      await user.click(projectHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      expect(rows[0]).toHaveTextContent("Project A");
      expect(rows[1]).toHaveTextContent("Project B");
      expect(rows[2]).toHaveTextContent("Project C");
    });

    // Sort by "Project" column (Descending)
    await act(async () => {
      await user.click(projectHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      expect(rows[0]).toHaveTextContent("Project C");
      expect(rows[1]).toHaveTextContent("Project B");
      expect(rows[2]).toHaveTextContent("Project A");
    });

    // Sort by "Consortium" column (Ascending)
    const consortiumHeader = screen.getByText("Consortium");
    await act(async () => {
      await user.click(consortiumHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      expect(rows[0]).toHaveTextContent("ConOpt1");
      expect(rows[1]).toHaveTextContent("ConOpt2");
      expect(rows[2]).toHaveTextContent("ConOpt3");
    });

    // Sort by "Consortium" column (Descending)
    await act(async () => {
      await user.click(consortiumHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      expect(rows[0]).toHaveTextContent("ConOpt3");
      expect(rows[1]).toHaveTextContent("ConOpt2");
      expect(rows[2]).toHaveTextContent("ConOpt1");
    });
  });

  // Test for displaying all projects when 'All Tags' and 'All Consortia' are selected
  it("Should displays all the projects when 'All Tags' and 'All Consortia' are selected", () => {
    // Use default mockProjectsSummaryData
    renderTagPage();

    // Ensure default selections are "All Tags" and "All Consortia"
    expect(screen.getByRole("button", { name: /all tags/i })).toHaveTextContent(
      "All Tags"
    );
    expect(
      screen.getByRole("button", { name: /all consortia/i })
    ).toHaveTextContent("All Consortia");

    // Verify all projects are displayed
    expect(screen.getByText("Project A")).toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();
    expect(screen.getByText("Project C")).toBeInTheDocument();
  });

  // Test for filtering by a specific consortium when 'All Tags' is selected
  it("Should only display projects from a specific consortium when 'All Tags' and a consortium are selected", async () => {
    renderTagPage();

    const user = userEvent.setup();

    // Click on the "All Consortia" dropdown
    const conDropdownButton = screen.getByRole("button", {
      name: /all consortia/i,
    });
    expect(conDropdownButton).toBeInTheDocument();

    await act(async () => {
      await user.click(conDropdownButton);
    });

    const conDropdownMenu = document.querySelector(".dropdown-menu.show");
    expect(conDropdownMenu).toBeInTheDocument();

    // Select "ConOpt2"
    const conOption = within(conDropdownMenu).getByText("ConOpt2");
    await act(async () => {
      await user.click(conOption);
    });

    // Assert that the "All Consortia" dropdown now shows "ConOpt2"
    expect(conDropdownButton).toHaveTextContent("ConOpt2");

    // Verify that only projects belonging to "ConOpt2" are displayed
    await waitFor(() => {
      expect(screen.queryByText("Project A")).not.toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
      expect(screen.queryByText("Project C")).not.toBeInTheDocument();
    });
  });

  // Test for filtering by a specific tag when 'All Consortia' is selected
  it("Should only display projects with a specific tag when that tag is selected", async () => {
    renderTagPage();

    const user = userEvent.setup();

    // Click on the "All Tags" dropdown
    const tagDropdownButton = screen.getByRole("button", { name: /all tags/i });
    expect(tagDropdownButton).toBeInTheDocument();

    await act(async () => {
      await user.click(tagDropdownButton);
    });

    // Find the dropdown menu
    const tagDropdownMenu = document.querySelector(".dropdown-menu.show");
    expect(tagDropdownMenu).toBeInTheDocument();

    // Select "TagOpt2"
    const tagOption = within(tagDropdownMenu).getByText("TagOpt2");
    await user.click(tagOption);

    // Verify the dropdown now shows "TagOpt2"
    expect(tagDropdownButton).toHaveTextContent("TagOpt2");

    // Verify that only "Project B" is displayed
    await waitFor(() => {
      expect(screen.queryByText("Project A")).not.toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
      expect(screen.queryByText("Project C")).not.toBeInTheDocument();
    });
  });

  // Test for filtering by both tag and consortium
  it("Should only display projects that match both the selected tag and consortium", async () => {
    renderTagPage();

    const user = userEvent.setup();

    // Select "TagOpt3" from the tags dropdown
    const tagDropdownButton = screen.getByRole("button", { name: /all tags/i });
    await act(async () => {
      await user.click(tagDropdownButton);
    });
    const tagDropdownMenu = document.querySelector(".dropdown-menu.show");
    const tagOption = within(tagDropdownMenu).getByText("TagOpt3");
    await user.click(tagOption);
    expect(tagDropdownButton).toHaveTextContent("TagOpt3");

    // Select "ConOpt3" from the consortia dropdown
    const conDropdownButton = screen.getByRole("button", {
      name: /all consortia/i,
    });
    await act(async () => {
      await user.click(conDropdownButton);
    });
    const conDropdownMenu = document.querySelector(".dropdown-menu.show");
    const conOption = within(conDropdownMenu).getByText("ConOpt3");
    await user.click(conOption);
    expect(conDropdownButton).toHaveTextContent("ConOpt3");

    // Verify that only "Project C" is displayed
    await waitFor(() => {
      expect(screen.queryByText("Project A")).not.toBeInTheDocument();
      expect(screen.queryByText("Project B")).not.toBeInTheDocument();
      expect(screen.getByText("Project C")).toBeInTheDocument();
    });
  });

  // Test for displaying no projects when filters do not match any projects
  it("Should display no projects when filters do not match any projects", async () => {
    renderTagPage();

    const user = userEvent.setup();

    // Select "TagOpt1" from the tags dropdown
    const tagDropdownButton = screen.getByRole("button", { name: /all tags/i });
    await act(async () => {
      await user.click(tagDropdownButton);
    });
    const tagDropdownMenu = document.querySelector(".dropdown-menu.show");
    const tagOption = within(tagDropdownMenu).getByText("TagOpt1");
    await user.click(tagOption);
    expect(tagDropdownButton).toHaveTextContent("TagOpt1");

    // Select "ConOpt3" from the consortia dropdown
    const conDropdownButton = screen.getByRole("button", {
      name: /all consortia/i,
    });
    await act(async () => {
      await user.click(conDropdownButton);
    });
    const conDropdownMenu = document.querySelector(".dropdown-menu.show");
    const conOption = within(conDropdownMenu).getByText("ConOpt3");
    await user.click(conOption);
    expect(conDropdownButton).toHaveTextContent("ConOpt3");

    // Verify that no projects are displayed
    await waitFor(() => {
      const rows = screen.getAllByRole("row");

      expect(rows.length).toBe(1);

      const dataRows = rows.slice(1);
      expect(dataRows.length).toBe(0);
    });
  });

  // Test for loading projects
  it("Should display Loading projects...", async () => {
    const mockData = {
      data: {
        1: {
          data: {
            name: "Project A",
            consortium: "ConOpt1",
            tags: ["TagOpt1"],
            resource_summary: {},
          },
        },
      },
    };

    useProjectsSummary.mockReturnValue(mockData);

    renderTagPage();

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  // Test for unable to load projects
  it("Should display an error message when unable to load projects", async () => {
    // Mock failed API responses by setting 'fetchError'
    useProjectsSummary.mockReturnValue({
      initialised: false,
      fetchError: "Failed to load projects",
      data: null,
    });
    useResources.mockReturnValue({
      initialised: true,
      fetchError: null,
      data: ["Resource data"],
    });
    useTags.mockReturnValue({
      initialised: true,
      fetchError: null,
      data: ["Tag data"],
    });
    useConsortia.mockReturnValue({
      initialised: true,
      fetchError: null,
      data: ["Consortium data"],
    });

    renderTagPage();

    // Wait for the component to update and render the error message
    await waitFor(() => {
      expect(screen.getByText("Unable to load projects.")).toBeInTheDocument();
    });

    // Verify that the alert has the correct variant
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("alert-danger");

    // Verify that the table is not rendered
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  const getTableRows = () => {
    const allRows = screen.getAllByRole("row");
    return allRows.slice(1);
  };

  it("Should sort the table columns correctly when (a[sortField] === null) return 1", async () => {
    // Redefine mockProjectsSummaryData with null values specific to this test
    const mockProjectsSummaryDataWithNulls = {
      initialised: true,
      fetching: false,
      fetchError: null,
      data: {
        1: {
          data: {
            name: "Project A",
            consortium: null,
            tags: ["TagOpt1"],
            resource_summary: {
              Resource_A: 10,
              Resource_B: 15,
            },
          },
        },
        2: {
          data: {
            name: "Project B",
            consortium: "ConOpt2",
            tags: ["TagOpt2"],
            resource_summary: {
              Resource_A: 10,
              Resource_B: 25,
            },
          },
        },
        3: {
          data: {
            name: "Project C",
            consortium: "ConOpt3",
            tags: ["TagOpt3"],
            resource_summary: {
              Resource_A: 15,
              Resource_B: 30,
            },
          },
        },
      },
    };

    // Mock the hooks with the modified data for this test
    useProjectsSummary.mockReturnValue(mockProjectsSummaryDataWithNulls);

    renderTagPage();

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
      expect(screen.getByText("Project C")).toBeInTheDocument();
    });

    // Sort by "Consortium" column (Ascending)
    const consortiumHeader = screen.getByText("Consortium");
    expect(consortiumHeader).toBeInTheDocument();

    await act(async () => {
      await user.click(consortiumHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      // Expected order after ascending sort:
      expect(rows[0]).toHaveTextContent("Project B");
      expect(rows[1]).toHaveTextContent("Project C");
      expect(rows[2]).toHaveTextContent("Project A");
    });

    // Sort by "Consortium" column (Descending)

    await act(async () => {
      consortiumHeader;
      await user.click(consortiumHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      // Expected order after descending sort:
      expect(rows[0]).toHaveTextContent("Project C");
      expect(rows[1]).toHaveTextContent("Project B");
      expect(rows[2]).toHaveTextContent("Project A");
    });

    // Verify that "—" is displayed where values are null
    const projectBRow = screen.getByText("Project A").closest("tr");

    expect(projectBRow).toBeInTheDocument();

    const projectBCells = within(projectBRow).getAllByRole("cell");

    // Adjust the index based on your table's column order
    expect(projectBCells[1]).toHaveTextContent("—");
  });

  it("Should sort the table columns correctly when (b[sortField] === null) return 1", async () => {
    // Redefine mockProjectsSummaryData with null values specific to this test
    const mockProjectsSummaryDataWithNulls = {
      initialised: true,
      fetching: false,
      fetchError: null,
      data: {
        1: {
          data: {
            name: "Project A",
            consortium: "ConOpt1",
            tags: ["TagOpt1"],
            resource_summary: {
              Resource_A: 10,
              Resource_B: 15,
            },
          },
        },
        2: {
          data: {
            name: "Project B",
            consortium: null,
            tags: ["TagOpt2"],
            resource_summary: {
              Resource_A: 10,
              Resource_B: 25,
            },
          },
        },
        3: {
          data: {
            name: "Project C",
            consortium: "ConOpt3",
            tags: ["TagOpt3"],
            resource_summary: {
              Resource_A: 15,
              Resource_B: 30,
            },
          },
        },
      },
    };

    // Mock the hooks with the modified data for this test
    useProjectsSummary.mockReturnValue(mockProjectsSummaryDataWithNulls);

    renderTagPage();

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
      expect(screen.getByText("Project C")).toBeInTheDocument();
    });

    // Sort by "Consortium" column (Ascending)
    const consortiumHeader = screen.getByText("Consortium");
    expect(consortiumHeader).toBeInTheDocument();

    await act(async () => {
      await user.click(consortiumHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      // Expected order after ascending sort:
      expect(rows[0]).toHaveTextContent("Project A");
      expect(rows[1]).toHaveTextContent("Project C");
      expect(rows[2]).toHaveTextContent("Project B");
    });

    // Sort by "Consortium" column (Descending)

    await act(async () => {
      consortiumHeader;
      await user.click(consortiumHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      // Expected order after descending sort:
      expect(rows[0]).toHaveTextContent("Project C");
      expect(rows[1]).toHaveTextContent("Project A");
      expect(rows[2]).toHaveTextContent("Project B");
    });

    // Verify that "—" is displayed where values are null
    const projectBRow = screen.getByText("Project B").closest("tr");

    expect(projectBRow).toBeInTheDocument();

    const projectBCells = within(projectBRow).getAllByRole("cell");

    // Adjust the index based on your table's column order
    expect(projectBCells[1]).toHaveTextContent("—");
  });

  it("Should sort the table columns correctly when if (a[sortField] === null && b[sortField] === null) return 0", async () => {
    // Redefine mockProjectsSummaryData with null values specific to this test
    const mockProjectsSummaryDataWithNulls = {
      initialised: true,
      fetching: false,
      fetchError: null,
      data: {
        1: {
          data: {
            name: "Project A",
            consortium: null,
            tags: ["TagOpt1"],
            resource_summary: {
              Resource_A: 10,
              Resource_B: 15,
            },
          },
        },
        2: {
          data: {
            name: "Project B",
            consortium: null,
            tags: ["TagOpt2"],
            resource_summary: {
              Resource_A: 10,
              Resource_B: 25,
            },
          },
        },
      },
    };

    // Mock the hooks with the modified data for this test
    useProjectsSummary.mockReturnValue(mockProjectsSummaryDataWithNulls);

    renderTagPage();

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
    });

    // Sort by "Consortium" column (Ascending)
    const consortiumHeader = screen.getByText("Consortium");
    expect(consortiumHeader).toBeInTheDocument();

    await act(async () => {
      await user.click(consortiumHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      // Expected order after ascending sort:
      expect(rows[0]).toHaveTextContent("Project A");
      expect(rows[1]).toHaveTextContent("Project B");
    });

    // Sort by "Consortium" column (Descending)

    await act(async () => {
      consortiumHeader;
      await user.click(consortiumHeader);
    });

    await waitFor(() => {
      const rows = getTableRows();
      // Expected order after descending sort:
      expect(rows[0]).toHaveTextContent("Project A");
      expect(rows[1]).toHaveTextContent("Project B");
    });

    // Verify that "—" is displayed where values are null
    const projectARow = screen.getByText("Project A").closest("tr");
    const projectBRow = screen.getByText("Project B").closest("tr");

    expect(projectARow).toBeInTheDocument();
    expect(projectBRow).toBeInTheDocument();

    const projectACells = within(projectARow).getAllByRole("cell");
    const projectBCells = within(projectBRow).getAllByRole("cell");

    // Adjust the index based on your table's column order
    expect(projectACells[1]).toHaveTextContent("—");
    expect(projectBCells[1]).toHaveTextContent("—");
  });

  // Test for when no tags are present
  it("Should be no tags present in dropdown", async () => {
    const mockProjectsSummaryDataWithNulls = {
      initialised: true,
      fetching: false,
      fetchError: null,
      data: {
        1: {
          data: {
            name: "Project A",
            consortium: "ConOpt1",
            tags: [],
            resource_summary: {
              Resource_A: 10,
              Resource_B: 15,
            },
          },
        },
        2: {
          data: {
            name: "Project B",
            consortium: "ConOpt2",
            tags: [],
            resource_summary: {
              Resource_A: 10,
              Resource_B: 25,
            },
          },
        },
      },
    };

    // Mock the hooks with the modified data for this test
    useProjectsSummary.mockReturnValue(mockProjectsSummaryDataWithNulls);

    renderTagPage();

    const user = userEvent.setup();

    // "All Tags" dropdown
    const tagDropdownButton = screen.getByRole("button", { name: /all tags/i });
    expect(tagDropdownButton).toBeInTheDocument();

    // Click on "All Tags" dropdown
    await act(async () => {
      await user.click(tagDropdownButton);
    });

    // Verify only 'All Tags' is present
    const tagDropdownMenu = document.querySelector(".dropdown-menu.show");
    expect(tagDropdownMenu).toBeInTheDocument("All Tags");
  });

  // Test for when no consortia are present
  it("Should not display column if no data is present", async () => {
    const mockProjectsSummaryDataWithNullConsortium = {
      initialised: true,
      fetching: false,
      fetchError: null,
      data: {
        1: {
          data: {
            name: "Project A",
            consortium: null,
            tags: ["TagOpt1"],
            resource_summary: {
              Resource_A: 0,
              Resource_B: 15,
            },
          },
        },
        2: {
          data: {
            name: "Project B",
            consortium: null,
            tags: ["TagOpt2"],
            resource_summary: {
              Resource_A: 0,
              Resource_B: 25,
            },
          },
        },
      },
    };

    useProjectsSummary.mockReturnValue(
      mockProjectsSummaryDataWithNullConsortium
    );

    renderTagPage();

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
    });

    // Verify that the column with no data is not included in the filtered columns
    const tableHeaders = screen.getAllByRole("columnheader");
    const headerTexts = tableHeaders.map((header) => header.textContent);

    // Check that "Resource A" is not in the headers because it has no data
    expect(headerTexts).not.toContain("Resource A");
    // Check that "Resource B" is in the headers because it has data
    expect(headerTexts).toContain("Resource B");
  });
});
