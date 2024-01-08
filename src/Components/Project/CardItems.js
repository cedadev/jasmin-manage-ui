import React from 'react';

import ListGroup from 'react-bootstrap/ListGroup';

import { Link } from 'react-router-dom';

import moment from 'moment';

import { Status, useNestedResource } from '../../rest-resource';

import { useConsortia, useCurrentUser } from '../../api';

import { SpinnerWithText } from '../utils';


const projectStatusVariants = {
    EDITABLE: 'warning',
    UNDER_REVIEW: 'info',
    COMPLETED: 'light'
};


export const ProjectStatusListItem = ({ project }) => (
    <ListGroup.Item variant={projectStatusVariants[project.data.status]}>
        Project is <strong>{project.data.status}</strong>.
    </ListGroup.Item>
);


export const ProjectConsortiumListItem = ({ project }) => {
    const currentUser = useCurrentUser();
    const consortia = useConsortia();
    return (
        <ListGroup.Item>
            <Status fetchable={consortia}>
                <Status.Loading>
                    <SpinnerWithText>Loading consortia...</SpinnerWithText>
                </Status.Loading>
                <Status.Unavailable>
                    <span className="text-danger">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Unable to load consortia.
                    </span>
                </Status.Unavailable>
                <Status.Available>
                    {data => {
                        const consortium = data[project.data.consortium];
                        const isConsortiumManager = consortium.data.manager.id === currentUser.data.id;
                        return (<>
                            <p className="mb-0">
                                Project belongs to{" "}
                                {isConsortiumManager ? (
                                    <Link
                                        className="font-weight-bold"
                                        to={{
                                            pathname: `/consortia/${consortium.data.id}`,
                                            state: { initialData: consortium.data }
                                        }}
                                    >
                                        {consortium.data.name}
                                    </Link>
                                ) : (
                                    <strong>{consortium.data.name}</strong>
                                )}
                                .
                            </p>
                            {isConsortiumManager && (
                                <p className="mt-2 mb-0">
                                    <strong>You are the consortium manager.</strong>
                                </p>
                            )}
                        </>);
                    }}
                </Status.Available>
            </Status>
        </ListGroup.Item>
    );
};


export const ProjectCollaboratorsListItem = ({ project, CollaboratorsComponent = "strong" }) => {
    const currentUser = useCurrentUser();
    // If the collaborators have been loaded, use them to get an accurate number
    // But we don't want to force them to load now as we can use the info from the project
    const collaborators = useNestedResource(project, "collaborators", { fetchPoint: false });
    // If the collaborators are loaded, use an accurate count
    // Otherwise use the summary number from loading the project list
    const numCollaborators = collaborators.initialised ?
        Object.keys(collaborators.data).length :
        (project.data.num_collaborators || 0);
    // Get the user's collaborator record
    // Note that we can safely use data even if the collaborators are not initialised
    // as it will just be an empty dictionary
    const userCollaborator = Object.values(collaborators.data)
        .filter(c => c.data.user.id === currentUser.data.id)
        .shift();
    // Get the user's role, either from the collaborator record (if it exists) or from the project
    const userRole = userCollaborator ? userCollaborator.data.role : project.data.current_user_role;
    return (
        <ListGroup.Item>
            <p className="mb-0">
                Project has{" "}
                <CollaboratorsComponent project={project}>
                    {numCollaborators} collaborator{numCollaborators !== 1 ? 's' : ''}
                </CollaboratorsComponent>.
            </p>
            {userRole && (
                // Only show the user's role if they have one
                // For example, consortium managers can view the project but do not have a role
                <p className="mt-2 mb-0">
                    You are{' '}
                    {/^[aeiou]/i.test(userRole) ? 'an' : 'a'}{' '}
                    <strong>{userRole.toLowerCase()}</strong>.
                </p>
            )}
        </ListGroup.Item>
    );
};


export const ProjectCreatedAtListItem = ({ project }) => {
    const createdAt = moment(project.data.created_at).fromNow();
    return <ListGroup.Item>Project was created <strong>{createdAt}</strong>.</ListGroup.Item>;
};

export const ProjectTagItem = ({ tags }) => {
    // Number corresponding to the tags
    var tagkeys = tags.data;
    // Only return tag item if there is one
    if (Object.keys(tagkeys).length>0) {
        return (
            <div style={{display: "inline-flex"}}>
                {Object.keys(tagkeys).map((d) => (
                    <div>
                        <button 
                            class="btn btn-light"
                            type="button" 
                            style={{
                                borderRadius: "20px",
                                lineHeight:"1px",
                                textAlign: "center",
                                fontSize: "14px",
                                display: "inline-block",
                                margin: "0px 2px",
                                height: "25px"
                            }}
                        >
                          {tagkeys[d].data.name}
                        </button>
                    </div>
                ))}
            </div>
        );
    }
    return ""
}

export const TagConsortiumItem = ({ project }) => {
    // Map the consortia id to the consortia names
    const consortia = useConsortia();
    return (
        <Status fetchable={consortia}>
            <Status.Loading>
                <SpinnerWithText>Loading consortia...</SpinnerWithText>
             </Status.Loading>
             <Status.Unavailable>
                <span className="text-danger">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Unable to load consortia.
                </span>
            </Status.Unavailable>
            <Status.Available>
                {data => {
                    const consortium = data[project.data.consortium];
                    return (consortium.data.name);
                    }}
                </Status.Available>
        </Status>
    );
}