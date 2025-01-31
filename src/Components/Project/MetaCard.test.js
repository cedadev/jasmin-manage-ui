import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ProjectMetaCard } from "./MetaCard";
import { useNotifications } from "react-bootstrap-notify";
import {
  useNestedResource,
  useAggregateResource,
  Form as ResourceForm,
} from "../../rest-resource";
import { notificationFromError } from "../utils";
import { useProjectPermissions, useProjectActions } from "./actions";

// Mock all the required modules
jest.mock("react-bootstrap-notify", () => ({
  useNotifications: jest.fn(),
}));

// Mock rest-resource with Form components
jest.mock("../../rest-resource", () => {
  const actualModule = jest.requireActual("../../rest-resource");
  return {
    ...actualModule,
    useNestedResource: jest.fn(),
    useAggregateResource: jest.fn(),
    Form: {
      Controls: {
        asControl: jest.fn((component) => component),
        ErrorList: () => null,
        CancelButton: ({ children }) => <button>{children}</button>,
        SubmitButton: ({ children }) => (
          <button type="submit">{children}</button>
        ),
      },
      InstanceActionForm: ({ children, onSuccess, onError }) => (
        <form
          role="form"
          onSubmit={(e) => {
            e.preventDefault();
            onSuccess();
          }}
        >
          {children}
        </form>
      ),
    },
    InstanceActionButton: ({ onError }) => (
      <button
        onClick={() => onError(new Error("Provisioning error"))}
        data-testid="provision-button"
      >
        {" "}
        Submit for provisioning{" "}
      </button>
    ),
  };
});

jest.mock("./actions", () => ({
  useProjectPermissions: jest.fn(),
  useProjectActions: jest.fn(),
}));

// Mock Modal component from react-bootstrap
jest.mock("react-bootstrap/Modal", () => {
  const Modal = ({ children, show }) =>
    show ? <div role="dialog">{children}</div> : null;
  Modal.Header = ({ children }) => (
    <div data-testid="modal-header">{children}</div>
  );
  Modal.Title = ({ children }) => (
    <div data-testid="modal-title">{children}</div>
  );
  Modal.Body = ({ children }) => <div data-testid="modal-body">{children}</div>;
  Modal.Footer = ({ children }) => (
    <div data-testid="modal-footer">{children}</div>
  );
  return {
    __esModule: true,
    default: Modal,
    Header: Modal.Header,
    Title: Modal.Title,
    Body: Modal.Body,
    Footer: Modal.Footer,
  };
});

// Mock the components used in MetaCard
jest.mock("./CardItems", () => ({
  ProjectStatusListItem: () => <div>Status</div>,
  ProjectConsortiumListItem: () => <div>Consortium</div>,
  ProjectCollaboratorsListItem: () => <div>Collaborators</div>,
  ProjectCreatedAtListItem: () => <div>Created At</div>,
}));

jest.mock("./ServiceCreateButton", () => ({
  ServiceCreateButton: () => <button>Create Service</button>,
}));

// Mock the utils module
jest.mock("../utils", () => ({
  notificationFromError: jest.fn((error) => ({
    level: "danger",
    title: error.name,
    message: error.message,
    duration: 5000,
  })),
  MarkdownEditor: ({ value, onChange }) => (
    <textarea value={value} onChange={onChange} data-testid="markdown-editor" />
  ),
}));

describe("ProjectMetaCard Component", () => {
  const mockProject = {
    id: 1,
    data: {
      name: "Test Project",
      status: "EDITABLE",
    },
  };

  const mockEvents = { markDirty: jest.fn() };
  const mockNotify = jest.fn();

  beforeEach(() => {
    useNotifications.mockReturnValue(mockNotify);

    useNestedResource.mockReturnValue({
      initialised: true,
      fetching: false,
      data: {},
      markDirty: jest.fn(),
      fetchError: null,
    });

    useAggregateResource.mockReturnValue({
      initialised: true,
      fetching: false,
      data: {},
      markDirty: jest.fn(),
      fetchError: null,
    });

    useProjectPermissions.mockReturnValue({
      canEditRequirements: true,
      canSubmitForReview: true,
      canRequestChanges: true,
      canSubmitForProvisioning: true,
    });

    useProjectActions.mockReturnValue({
      allowEditRequirements: true,
      allowSubmitForReview: true,
      allowRequestChanges: true,
      allowSubmitForProvisioning: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should render button with trigger text", () => {
    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);
    expect(screen.getByText("Submit for review")).toBeInTheDocument();
  });

  it("Should show modal when clicked", async () => {
    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit for review"));
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Should render without buttons when no permissions", () => {
    useProjectPermissions.mockReturnValue({
      canEditRequirements: false,
      canSubmitForReview: false,
      canRequestChanges: false,
      canSubmitForProvisioning: false,
    });

    useProjectActions.mockReturnValue({
      allowEditRequirements: false,
      allowSubmitForReview: false,
      allowRequestChanges: false,
      allowSubmitForProvisioning: false,
    });

    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Consortium")).toBeInTheDocument();
    expect(screen.getByText("Collaborators")).toBeInTheDocument();
    expect(screen.getByText("Created At")).toBeInTheDocument();
  });

  it("Should show submit for review button when permitted", () => {
    useProjectPermissions.mockReturnValue({
      canSubmitForReview: true,
      canEditRequirements: false,
      canRequestChanges: false,
      canSubmitForProvisioning: false,
    });

    useProjectActions.mockReturnValue({
      allowSubmitForReview: true,
      allowEditRequirements: false,
      allowRequestChanges: false,
      allowSubmitForProvisioning: false,
    });

    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);
    expect(screen.getByText("Submit for review")).toBeInTheDocument();
  });

  it("Should handle form submission successfully", async () => {
    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit for review"));
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("form"));
    });

    expect(mockEvents.markDirty).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Should close modal when cancelled", async () => {
    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit for review"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Cancel"));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Should handle error in comment submission", async () => {
    const mockError = new Error("Test error");

    const { Form } = require("../../rest-resource");
    Form.InstanceActionForm = jest.fn(({ children, onError }) => (
      <form
        role="form"
        onSubmit={(e) => {
          e.preventDefault();
          onError(mockError);
        }}
      >
        {children}
      </form>
    ));

    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit for review"));
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("form"));
    });

    expect(mockNotify).toHaveBeenCalledWith(notificationFromError(mockError));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Should handle markdown editor changes", async () => {
    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit for review"));
    });

    const editor = screen.getByTestId("markdown-editor");
    await act(async () => {
      fireEvent.change(editor, { target: { value: "Test comment" } });
    });

    expect(editor.value).toBe("Test comment");
  });

  it("Should handle error in provisioning submission", async () => {
    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit for provisioning"));
    });

    expect(mockNotify).toHaveBeenCalledWith({
      level: "danger",
      title: "Error",
      message: "Provisioning error",
      duration: 5000,
    });
  });

  it("Should properly extract value from markdown editor event", async () => {
    let capturedValueExtractor;
    jest
      .spyOn(ResourceForm.Controls, "asControl")
      .mockImplementation((Component, valueExtractor) => {
        capturedValueExtractor = valueExtractor;
        return Component;
      });

    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    // Create a mock event
    const mockEvent = {
      target: {
        value: "Test value",
      },
    };

    const extractedValue = capturedValueExtractor(mockEvent);
    expect(extractedValue).toBe("Test value");
  });

  it("Should handle successful provisioning submission", async () => {
    jest
      .spyOn(require("../../rest-resource"), "InstanceActionButton")
      .mockImplementation(({ onSuccess }) => (
        <button onClick={() => onSuccess()} data-testid="provision-button">
          Submit for provisioning
        </button>
      ));

    useProjectPermissions.mockReturnValue({
      canSubmitForProvisioning: true,
      canEditRequirements: false,
      canRequestChanges: false,
      canSubmitForReview: false,
    });

    useProjectActions.mockReturnValue({
      allowSubmitForProvisioning: true,
      allowEditRequirements: false,
      allowRequestChanges: false,
      allowSubmitForReview: false,
    });

    const mockRequirements = { markDirty: jest.fn() };
    useAggregateResource.mockReturnValue(mockRequirements);

    render(<ProjectMetaCard project={mockProject} events={mockEvents} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Submit for provisioning"));
    });

    expect(mockEvents.markDirty).toHaveBeenCalled();
    expect(mockRequirements.markDirty).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});
