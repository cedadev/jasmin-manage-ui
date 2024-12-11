import React, { useState } from "react";

import Alert from "react-bootstrap/Alert";

import {
  Col,
  Row,
  DropdownButton,
  Dropdown,
  Card,
  ListGroup,
  ListGroupItem,
} from "react-bootstrap";

import Table from "react-bootstrap/Table";

import { LinkContainer } from "react-router-bootstrap";

import { PageHeader } from "fwtheme-react-jasmin";

import { Status, useNestedResource } from "../../rest-resource";

import {
  useProjects,
  useResources,
  useCurrentUser,
  useProjectsSummary,
  useTags,
  useConsortia,
} from "../../api";

import { sortByKey, SpinnerWithText, notificationFromError } from "../utils";

import { ProjectTagItem, TagConsortiumItem } from "../Project/CardItems";

const TableHead = ({ columns, handleSorting }) => {
  const [sortField, setSortField] = useState("");
  const [order, setOrder] = useState("asc");
  const handleSortingChange = (accessor) => {
    const sortOrder =
      accessor === sortField && order === "asc" ? "desc" : "asc";
    setSortField(accessor);
    setOrder(sortOrder);
    handleSorting(accessor, sortOrder);
  };
  return (
    <>
      <thead>
        <tr>
          {columns.map(({ label, accessor, sortable }) => {
            const cl = sortable
              ? sortField === accessor && order === "asc"
                ? "fas fa-fw fa-sort-up"
                : sortField === accessor && order === "desc"
                ? "fas fa-fw fa-sort-down"
                : "fas fa-fw fa-sort"
              : "";
            return (
              <th
                key={accessor}
                onClick={sortable ? () => handleSortingChange(accessor) : null}
              >
                {label}
                <div className={cl}></div>
              </th>
            );
          })}
        </tr>
      </thead>
    </>
  );
};

const TableBody = ({ tableData, columns, rowVisible }) => {
  return (
    <>
      <tbody>
        {tableData.map((data) => {
          if (rowVisible[data.id]) {
            return (
              <tr key={data.id}>
                {columns.map(({ accessor }) => {
                  const tData = data[accessor] ? data[accessor] : "—";
                  return <td key={accessor}>{tData}</td>;
                })}
              </tr>
            );
          }
        })}
      </tbody>
    </>
  );
};

const TagList = ({ projectsSummary, resources, tagData, consortium }) => {
  //Define columns
  var columns = [
    { label: "Project", accessor: "project", sortable: true },
    { label: "Consortium", accessor: "consortium", sortable: true },
    { label: "Tags", accessor: "tags", sortable: false },
  ];
  const dont_sum_columns = ["project", "tags", "consortium"]; // this is needed because we try to summ all the fields
  var i = 0;
  while (i < Object.values(resources.data).length) {
    columns = [
      ...columns,
      {
        label: Object.values(resources.data)[i].data["name"],
        accessor: Object.values(resources.data)[i].data["name"].replaceAll(
          " ",
          "_"
        ),
        sortable: true,
      },
    ];
    i++;
  }
  // Tag dropdown
  const [tagSelect, setTag] = useState("All Tags");
  const handleSelectTag = (e) => {
    setTag(e);
  };
  // Consortium dropdown
  const [conSelect, setCon] = useState("All Consortia");
  const handleSelectCon = (e) => {
    setCon(e);
  };

  var tableData1 = [];
  // Create an object to track whether we want to row visible depending on the filters
  var rowVisible = {};
  var i = 0;
  // Create table data
  while (i < Object.keys(projectsSummary.data).length) {
    // Add a row id to map between the visible row list, with the the data row in the table so we can hide rows with the drop downs

    // build the data for the table
    var project = Object.values(projectsSummary.data)[i].data;
    var dataline = {};
    dataline["id"] = i;
    dataline["project"] = project["name"];
    dataline["consortium"] = project["consortium"];
    var t = 0;
    var tags = [];
    while (t < project["tags"].length) {
      tags = [...tags, project["tags"][t] + ", "];
      t++;
    }
    if (tags.length >= 1) {
      tags[t - 1] = tags[t - 1].slice(0, -2);
    }
    dataline["tags"] = tags;

    var r = 0;
    while (r < Object.values(project["resource_summary"]).length) {
      dataline[
        Object.keys(project["resource_summary"])[r].replaceAll(" ", "_")
      ] = Object.values(project["resource_summary"])[r];

      r++;
    }
    // Only include the data row if the tag and con is selected in the drop down
    if (tagSelect == "All Tags" && conSelect == "All Consortia") {
      rowVisible[i] = true;
    } else if (tagSelect == "All Tags" && conSelect == project["consortium"]) {
      rowVisible[i] = true;
    } else if (
      (tags.includes(tagSelect) || tags.includes(tagSelect + ", ")) &&
      conSelect == project["consortium"]
    ) {
      rowVisible[i] = true;
    } else if (
      (tags.includes(tagSelect) || tags.includes(tagSelect + ", ")) &&
      conSelect == "All Consortia"
    ) {
      rowVisible[i] = true;
    } else {
      rowVisible[i] = false;
    }
    // Update the list of data for the table
    tableData1 = [...tableData1, dataline];
    i++;
  }

  var filteredColumns = [];
  // Remove columns with no data
  var c = 0;
  while (c < Object.values(columns).length) {
    // Check whether there's any data in the column
    const column_name = Object.values(columns)[c]["accessor"];
    // If its in the defined list
    if (dont_sum_columns.includes(column_name)) {
      filteredColumns = [...filteredColumns, Object.values(columns)[c]];
    } else {
      // Loop through the respective data column and
      // sum the column - if its zero then there's no data
      var d = 0;
      var column_sum = 0;
      while (d < Object.values(tableData1).length) {
        column_sum += Object.values(tableData1)[d][column_name];
        d++;
      }
      // If the sum is not zero, then add the column
      if (column_sum > 0) {
        filteredColumns = [...filteredColumns, Object.values(columns)[c]];
      }
    }
    c++;
  }
  // Sort by project name

  // Handle the sorting of data
  const [tableData, setTableData] = useState(tableData1);

  const handleSorting = (sortField, sortOrder) => {
    if (sortField) {
      const sorted = [...tableData].sort((a, b) => {
        if (a[sortField] === null && b[sortField] === null) return 0;
        if (a[sortField] === null) return 1;
        if (b[sortField] === null) return -1;
        return (
          a[sortField].toString().localeCompare(b[sortField].toString(), "en", {
            numeric: true,
          }) * (sortOrder === "asc" ? 1 : -1)
        );
      });
      setTableData(sorted);
    }
  };
  // sort the values of the drop downs
  const conDropDownData = Object.values(consortium.data)
    .map((c) => c.data.name)
    .sort();
  const tagDropDownData = Object.values(tagData.data)
    .map((t) => t.data.name)
    .sort();

  return (
    <>
      <Col>
        <p>
          View of all projects, including filters for tags and consortia. Some
          columns can be sorted.
        </p>
        <Row>
          <Col>
            <DropdownButton
              title={tagSelect}
              value={tagSelect}
              onSelect={handleSelectTag}
            >
              <Dropdown.Item key="all-tags" eventKey="All Tags">
                All Tags
              </Dropdown.Item>
              {tagDropDownData.map((tag) => (
                <Dropdown.Item key={tag} eventKey={tag}>
                  {tag}
                </Dropdown.Item>
              ))}
            </DropdownButton>
          </Col>
          <Col>
            <DropdownButton
              title={conSelect}
              value={conSelect}
              onSelect={handleSelectCon}
            >
              <Dropdown.Item key="all-consortia" eventKey="All Consortia">
                All Consortia
              </Dropdown.Item>
              {conDropDownData.map((con) => (
                <Dropdown.Item key={con} eventKey={con}>
                  {con}
                </Dropdown.Item>
              ))}
            </DropdownButton>
          </Col>
          <Col></Col>
          <Col></Col>
          <Col></Col>
          <Col></Col>
          <Col></Col>
          <Col></Col>
          <Col></Col>
        </Row>
        <p></p>
        <Table striped responsive="md" size="sm">
          <TableHead columns={filteredColumns} handleSorting={handleSorting} />
          <TableBody
            tableData={tableData}
            columns={filteredColumns}
            rowVisible={rowVisible}
          />
        </Table>
      </Col>
    </>
  );
};

const TagPage = () => {
  const projectsSummary = useProjectsSummary();
  const resources = useResources();
  const tags = useTags();
  const consortium = useConsortia();

  return (
    <>
      <PageHeader>Projects List</PageHeader>
      <Status.Many fetchables={[projectsSummary, resources, tags, consortium]}>
        <Status.Loading>
          <div className="d-flex justify-content-center my-5">
            <SpinnerWithText iconSize="lg" textSize="120%">
              Loading projects...
            </SpinnerWithText>
          </div>
        </Status.Loading>
        <Status.Unavailable>
          <Alert variant="danger">Unable to load projects.</Alert>
        </Status.Unavailable>
        <Status.Available>
          <TagList
            projectsSummary={projectsSummary}
            resources={resources}
            tagData={tags}
            consortium={consortium}
          />
        </Status.Available>
      </Status.Many>
    </>
  );
};

export default TagPage;
