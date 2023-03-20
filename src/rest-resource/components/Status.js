import React, { createContext, useContext } from 'react';


// Context for sharing the fetch state
export const StatusContext = createContext();


/**
 * Provides access to the fetch context.
 */
export const useStatusContext = () => useContext(StatusContext);


/**
 * Component that provides access to a fetchable using the context.
 */
export const Status = ({ fetchable, children }) => (
    <StatusContext.Provider value={fetchable}>{children}</StatusContext.Provider>
);


/**
 * Renders the given children only if the fetchable is initialising.
 */
Status.Loading = ({ children }) => {
    const { initialised, fetchError } = useStatusContext();
    return (!initialised && !fetchError) ? children : null;
};


/**
 * Renders the children only if the fetchable failed to initialise.
 */
Status.Unavailable = ({ children }) => {
    const { initialised, fetchError } = useStatusContext();
    if( initialised || !fetchError ) return null;
    return typeof children === 'function' ? children(fetchError) : children;
};


/**
 * Component that throws the fetch error if present.
 * 
 * This is used to throw fetch errors during a render so that they can be caught
 * by an error boundary.
 */
Status.Throw = () => {
    const { fetchError } = useStatusContext();
    if( fetchError ) throw fetchError;
    // If there is no error, then there is nothing to render
    return null;
};


/**
 * Renders the children only if the fetchable is initialised.
 */
Status.Available = ({ children }) => {
    const { initialised, data } = useStatusContext();
    if( !initialised ) return <p>Loading</p>;
    return typeof children === 'function' ? children(data) : children;
};


/**
 * Allows multiple fetchables to be waited for as if they are one.
 *
 * The data that is returned is an array containing the data for each resource.
 */
Status.Many = ({ fetchables, children }) => {
    // Make a fake fetchable whose state is a merge of the given fetchables
    const merged = fetchables.reduce(
        (merged, fetchable) => ({
            // The merged fetchable is initialised when all fetchables are initialised
            initialised: merged.initialised && fetchable.initialised,
            // The merged fetchable is fetching when one fetchable is fetching
            fetching: merged.fetching || fetchable.fetching,
            // Report the first error
            fetchError: merged.fetchError || fetchable.fetchError,
            // The data is an array of the data for each fetchable
            data: [...merged.data, fetchable.data]
        }),
        { initialised: true, fetching: false, fetchError: null, data: [] }
    );
    // The merged fetchable can be used with the regular status component
    return <Status fetchable={merged}>{children}</Status>;
};
