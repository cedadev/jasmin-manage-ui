import { useNestedResource, useAggregateResource } from '../../rest-resource';

import { useConsortia, useCurrentUser } from '../../api';


/**
 * Hook to access the current user's roles for the given project.
 */
export const useProjectUserRoles = project => {
    const currentUser = useCurrentUser();
    // Extract the consortium for the project
    // If the consortia are not loaded, return nothing
    const consortia = useConsortia();
    const consortium = consortia.data[project.data.consortium];
    // This is not a fetch point for collaborators - we just want to use the
    // information if it has been loaded elsewhere
    const collaborators = useNestedResource(project, "collaborators", { fetchPoint: false });

    // Get the user's role, either from the collaborator record (if one exists) or from the project
    const userCollaborator = Object.values(collaborators.data)
        .filter(c => c.data.user.id === currentUser.data.id)
        .shift();
    const userRole = userCollaborator ?
        userCollaborator.data.role :
        project.data.current_user_role;

    return {
        // If the user has a role, they are a collaborator
        isProjectCollaborator: !!userRole,
        // If the user role is OWNER, then they are an owner
        isProjectOwner: userRole && userRole === "OWNER",
        // For this, we need to check the consortium
        isConsortiumManager: (
            // Wait for the consortia to load before deciding
            consortium &&
            consortium.data.manager.id === currentUser.data.id
        )
    };
};


/**
 * Hook to access the current user's permissions for the given project.
 */
export const useProjectPermissions = project => {
    const projectRoles = useProjectUserRoles(project);
    const currentUser = useCurrentUser();
    return {
        // Collaborators (including invitations) can be edited any time,
        // but only by a project owner
        canEditCollaborators: projectRoles.isProjectOwner,
        canEditTags: (projectRoles.isConsortiumManager || currentUser.data.is_staff) && project.data.status === 'EDITABLE',
        canSeeTags: projectRoles.isConsortiumManager || currentUser.data.is_staff,
        isConsortiumManager: projectRoles.isConsortiumManager,
        isStaffUser: currentUser.data.is_staff,
        // The project can be edited by collaborators when in editable mode
        canEditRequirements: (
            project.data.status === "EDITABLE" &&
            projectRoles.isProjectCollaborator
        ),
        // The project can be submitted for review by a project owner
        // when in editable mode
        canSubmitForReview: (
            project.data.status === "EDITABLE" &&
            projectRoles.isProjectOwner
        ),
        // Requirements can be approved by consortium managers, but only when
        // the project is under review
        canApproveRequirements: (
            project.data.status === "UNDER_REVIEW" &&
            projectRoles.isConsortiumManager
        ),
        // Changes can be requested by the consortium manager for a project
        // that is under review
        canRequestChanges: (
            project.data.status === "UNDER_REVIEW" &&
            projectRoles.isConsortiumManager
        ),
        // A project that is under review can be submitted for provisioning by
        // the consortium manager
        canSubmitForProvisioning: (
            project.data.status === "UNDER_REVIEW" &&
            projectRoles.isConsortiumManager
        )
    };
};


/**
 * Hook to access the available actions for the current project.
 */
export const useProjectActions = project => {
    // Get all the project requirements by aggregating across the services
    // However this is not a fetch point for services or requirements - we only
    // use them once they have been loaded elsewhere in the component tree
    const services = useNestedResource(project, "services", { fetchPoint: false });
    const requirements = useAggregateResource(services, "requirements", { fetchPoint: false });

    // Work out if the project has requirements with various statuses
    const hasRequirementsWithStatus = status => {
        const count = Object.values(requirements.data)
            .filter(requirement => requirement.data.status === status)
            .length;
        return count > 0;
    };
    const hasRequestedRequirements = hasRequirementsWithStatus("REQUESTED");
    const hasRejectedRequirements = hasRequirementsWithStatus("REJECTED");
    const hasApprovedRequirements = hasRequirementsWithStatus("APPROVED");

    // All these actions are not allowed while the project is updating
    return {
        // Requirements cannot be edited while the project is updating
        allowEditRequirements: !project.updating,
        // The project can only be submitted for review when there are no
        // rejected requirements and at least one requirement in either the
        // requested or approved state
        // That is to cover for the case where a requirement was rejected
        // alongside others that were approved, and then subsequently removed
        allowSubmitForReview: (
            !project.updating &&
            !hasRejectedRequirements &&
            (hasRequestedRequirements || hasApprovedRequirements)
        ),
        // Requirements cannot be approved while the project is updating
        allowApproveRequirements: !project.updating,
        // Changes can be requested for a project only when:
        //   1. All requested requirements have been resolved
        //   2. There is at least one rejected requirement
        allowRequestChanges: (
            !project.updating &&
            !hasRequestedRequirements &&
            hasRejectedRequirements
        ),
        // A project can be submitted for provisioning only once:
        //   1. All the requested requirements have been resolved
        //   2. There are no rejected requirements
        //   3. There is at least one approved requirement
        allowSubmitForProvisioning: (
            !project.updating &&
            !hasRequestedRequirements &&
            !hasRejectedRequirements &&
            hasApprovedRequirements
        )
    };
};
