import React, { useEffect, useRef, useState } from 'react';

import { useHistory, useLocation } from 'react-router-dom';

import classNames from 'classnames';

import Nav from 'react-bootstrap/Nav';

import ReactMarkdown from 'react-markdown';

import '../css/form-controls.css';


const base1000SizeUnits = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const base1024SizeUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
const amountSuffixes = ['', 'K', 'M', 'B', 'T'];


// This function takes a number and returns a formatted number and exponent
// such that [result] * 1000^[exponent] ~= [original number]
// If "decimalPlaces" is given, the result is truncated to the specified number
// of decimal places if required, and the result becomes potentially approximate
// as a result
// If "decimalPlaces" is not given, the result is not truncated
// A different base can also be specified if required (e.g. 1024 for GiB)
const formatNumber = (number, maxExponent, decimalPlaces, base = 1000) => {
    let denominator = 1, exponent = 0;
    while( exponent < maxExponent && number >= Math.pow(base, exponent + 1) ) {
        denominator = denominator * base;
        exponent = exponent + 1;
    }
    const result = number / denominator;
    let isTruncated = false, formattedResult = result;
    if( decimalPlaces ) {
        const factor = Math.pow(10, decimalPlaces);
        const truncatedResult = Math.floor(result * factor) / factor;
        isTruncated = result !== truncatedResult;
        formattedResult = Number.isInteger(truncatedResult) ?
            truncatedResult :
            truncatedResult.toFixed(decimalPlaces);
    }
    // Return the formatted result with the exponent
    // Indicate whether truncation has taken place using >
    return [`${isTruncated ? '>' : ''}${formattedResult}`, exponent];
};


const formatSize = (amount, originalUnits, unitsList, base, decimalPlaces) => {
    // If the amount is zero, then use the given units
    if( amount === 0 ) return `0 ${originalUnits}`;
    // Work out at what unit we are starting from
    const originalUnitsIndex = unitsList.indexOf(originalUnits);
    // Get the number and exponent
    const [formattedAmount, exponent] = formatNumber(
        amount,
        // We can only go as far as the units in the list
        unitsList.length - originalUnitsIndex - 1,
        decimalPlaces,
        base
    );
    // Return the formatted value
    return `${formattedAmount} ${unitsList[originalUnitsIndex + exponent]}`;
};


export const formatAmount = (amount, units, decimalPlaces) => {
    // If the amount is a size, either base 1000 or 1024, we treat it slightly differently
    if( base1000SizeUnits.includes(units) )
        return formatSize(amount, units, base1000SizeUnits, 1000, decimalPlaces);
    if( base1024SizeUnits.includes(units) )
        return formatSize(amount, units, base1024SizeUnits, 1024, decimalPlaces);
    // Otherwise, format the amount to reduce the number of zeros
    const [formattedAmount, exponent] = formatNumber(
        amount,
        amountSuffixes.length - 1,
        decimalPlaces
    );
    // Return the formatted value
    return `${formattedAmount}${amountSuffixes[exponent]}${units ? ` ${units}`: ''}`;
};


/**
 * Sort the data using the values produced by the key function.
 */
export const sortByKey = (data, keyFn, reverse = false) => [...data].sort(
    (e1, e2) => {
        const [k1, k2] = [keyFn(e1), keyFn(e2)];
        const result = (k1 > k2 ? 1 : (k1 < k2 ? -1 : 0));
        return reverse ? -result : result;
    }
);

/**
 * Function that produces a notification from an error object.
 */
export const notificationFromError = (error, duration = 5000) => {
    let title, message;
    // If the error object has status text use status text as title
    if( Object.hasOwn(error, "statusText") ) {
        title = error.statusText;
        // Extract the most useful information from the error for the message
        // If the error is JSON, use the structured representation
        // If not, just use the response text
        try {
            const errorObj = error.json();
            message = errorObj.detail || JSON.stringify(errorObj);
        }
        catch(parseError) {
            message = error.responseText;
        }
    }
    else {
        // For any other error, just use the name and message of the error
        title = error.name;
        message = error.message;
    }
    return { level: 'danger', title, message, duration };
};


/**
 * Hook for using the state from the location.
 *
 * Ensures that the state is cleared from the browser history, otherwise it stays
 * there and gets used the next time the page is loaded, even though it might
 * be out of date.
 */
export const useStateFromLocation = () => {
    // Use a ref to track the state that we have seen
    const stateRef = useRef(undefined);
    // Get the current state from the location
    const { pathname, state } = useLocation();
    // When the state changes, update the stored value and disassociate it from the path
    const history = useHistory();
    useEffect(
        () => {
            stateRef.current = { ...stateRef.current, ...state };
            history.replace(pathname, undefined);
        },
        [state]
    );
    return { ...stateRef.current, ...state };
};


const textSizes = { xs: '70%', sm: '80%', lg: '130%', xl: '150%' };

/**
 * Component that shows a spinner with some text.
 */
export const SpinnerWithText = ({
    children,
    // Controls the size of the icon RELATIVE TO THE TEXT
    iconSize,
    // Controls the size of the text INCLUDING THE ICON
    textSize = '100%',
    style,
    ...props
}) => (
    <div style={{ fontSize: textSizes[textSize] || textSize, ...style }} {...props}>
        <i
            className={classNames(
                "fas",
                "fa-spin",
                "fa-sync-alt",
                "mr-2",
                { [`fa-${iconSize}`]: !!iconSize }
            )}
        />
        {children}
    </div>
);


/**
 * Form control for a markdown editor.
 */
export const MarkdownEditor = ({ value, className, onFocus, ...props }) => {
    const [selectedTab, setSelectedTab] = useState("write");
    // The textarea is always visible, so that it can receive focus as part of form validation
    // However when the preview tab is active, we tweak the styles so that it is visually hidden
    const textareaStyles = selectedTab === "write" ?
        {} :
        {
            opacity: 0,
            height: 0,
            padding: 0,
            border: '1px solid transparent'
        };
    // When the textarea receives focus, switch to the write tab
    const handleReceiveFocus = (...args) => {
        setSelectedTab("write");
        if( onFocus ) onFocus(...args);
    };
    return (
        <div className={classNames("markdown-editor", className)}>
            <Nav variant="tabs" activeKey={selectedTab} onSelect={setSelectedTab}>
                <Nav.Item>
                    <Nav.Link eventKey="write">Write</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="preview">Preview</Nav.Link>
                </Nav.Item>
            </Nav>
            <textarea
                defaultValue={value}
                rows={5}
                className={className}
                style={textareaStyles}
                onFocus={handleReceiveFocus}
                {...props}
            />
            <div className={classNames(
                'markdown-editor-preview',
                { 'd-none': selectedTab !== "preview" }
            )}>
                <ReactMarkdown source={value || "Nothing to preview."} />
            </div>
            <small className="form-text text-muted">
                This field may contain{" "}
                <a href="https://www.markdownguide.org/" target="_blank">Markdown</a>.
            </small>
        </div>
    );
};
