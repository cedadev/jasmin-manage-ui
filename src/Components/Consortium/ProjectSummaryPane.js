import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import { useState } from "react";
import { DropdownButton, Dropdown } from "react-bootstrap";

import classNames from "classnames";

import { useHistory, useLocation } from "react-router-dom";

import { LinkContainer } from "react-router-bootstrap";

import {
  Status,
  useNestedResource,
  useEnsureInitialised,
} from "../../rest-resource";

import { useConsortiumSummary, useResources, useServices } from "../../api";

import { SpinnerWithText, formatAmount, sortByKey } from "../utils";

import "../../css/quota-card.css";

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
                {label} <div className={cl}></div>
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

const SummaryPane = ({ conSummary, consortium }) => {
  // Get the consortia id
  const con_id = consortium.data.id;

  // Build the url for the json version link
  const path = useLocation().pathname;
  const apiLocation = location["href"].replace(
    path,
    "/api" + path + "?format=json"
  );

  // Define columns
  const columnsInput = Object.keys(
    conSummary.data.project_summaries[0].resource_summary
  );
  var columns = [
    { label: "Project", accessor: "project", sortable: true },
    { label: "Tags", accessor: "tags", sortable: false },
    { label: "Collaborators", accessor: "collaborators", sortable: false },
  ];
  const dont_sum_columns = ["project", "tags", "collaborators"]; // this is needed because we try to summ all the fields
  var i = 0;
  while (i < Object.values(columnsInput).length) {
    columns = [
      ...columns,
      {
        label: Object.values(columnsInput)[i],
        accessor: Object.values(columnsInput)[i].replaceAll(" ", "_"),
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

  var tableData1 = [];
  var i = 0;
  // Create table data
  // Create an object to track whether we want to row visible depending on the filters
  var rowVisible = {};
  // Create set to keep track of what tags are being used so we can create a dropdown with only those
  var tagsSet = new Set([]);
  while (i < Object.keys(conSummary.data.project_summaries).length) {
    var dataline = {};
    dataline["id"] = i;
    dataline["project"] = conSummary.data.project_summaries[i]["project_name"];
    var t = 0;
    var tags = [];
    while (t < conSummary.data.project_summaries[i]["tags"].length) {
      tags = [...tags, conSummary.data.project_summaries[i]["tags"][t] + ", "];
      tagsSet.add(conSummary.data.project_summaries[i]["tags"][t]);
      t++;
    }
    if (tags.length >= 1) {
      tags[t - 1] = tags[t - 1].slice(0, -2);
    }
    dataline["tags"] = tags;
    var collabs = [];
    var c = 0;
    while (
      c <
      Object.values(conSummary.data.project_summaries[i]["collaborators"])
        .length
    ) {
      collabs = [
        ...collabs,
        conSummary.data.project_summaries[i]["collaborators"][c]["username"] +
          ", ",
      ];
      c++;
    }
    if (collabs.length >= 1) {
      collabs[c - 1] = collabs[c - 1].slice(0, -2);
    }

    dataline["collaborators"] = collabs;
    var r = 0;
    while (
      r <
      Object.values(conSummary.data.project_summaries[i]["resource_summary"])
        .length
    ) {
      dataline[
        Object.keys(conSummary.data.project_summaries[i]["resource_summary"])[
          r
        ].replaceAll(" ", "_")
      ] = Object.values(
        conSummary.data.project_summaries[i]["resource_summary"]
      )[r];

      r++;
    }

    tableData1 = [...tableData1, dataline];

    if (tagSelect == "All Tags") {
      rowVisible[i] = true;
    } else if (tags.includes(tagSelect) || tags.includes(tagSelect + ", ")) {
      rowVisible[i] = true;
    } else {
      rowVisible[i] = false;
    }
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

  // Handle the sorting of data
  const [tableData, setTableData] = useState(tableData1);

  const handleSorting = (sortField, sortOrder) => {
    if (sortField) {
      const sorted = [...tableData].sort((a, b) => {
        if (a[sortField] === null) return 1;
        if (b[sortField] === null) return -1;
        if (a[sortField] === null && b[sortField] === null) return 0;
        return (
          a[sortField].toString().localeCompare(b[sortField].toString(), "en", {
            numeric: true,
          }) * (sortOrder === "asc" ? 1 : -1)
        );
      });
      setTableData(sorted);
    }
  };

  // Sort the values of the tags for the drop down
  console.log(tagsSet);
  const tagData = Array.from(tagsSet);
  const tagDropDownData = tagData.sort();

  return (
    <Status fetchable={conSummary}>
      <Status.Loading>
        <div className="d-flex justify-content-center my-5">
          <SpinnerWithText iconSize="lg" textSize="120%">
            Loading data...
          </SpinnerWithText>
        </div>
      </Status.Loading>
      <Status.Unavailable>
        <Status.Throw />
      </Status.Unavailable>
      <Status.Available>
        <>
          <Col>
            <header>
              Resource summaries for all projects in Consortia. Column headers
              can be clicked on to order them, and tags can be filtered.
              <a href={apiLocation}> Direct link to JSON.</a>
            </header>
            <DropdownButton
              title={tagSelect}
              value={tagSelect}
              onSelect={handleSelectTag}
            >
              <Dropdown.Item eventKey="All Tags">All Tags</Dropdown.Item>
              {tagDropDownData.map((tag) => (
                <Dropdown.Item key={tag} eventKey={tag}>
                  {tag}
                </Dropdown.Item>
              ))}
            </DropdownButton>
            <Table striped responsive="md" size="sm">
              <TableHead
                columns={filteredColumns}
                handleSorting={handleSorting}
              />
              <TableBody
                tableData={tableData}
                columns={filteredColumns}
                rowVisible={rowVisible}
              />
            </Table>
          </Col>
        </>
      </Status.Available>
    </Status>
  );
};

export default SummaryPane;
