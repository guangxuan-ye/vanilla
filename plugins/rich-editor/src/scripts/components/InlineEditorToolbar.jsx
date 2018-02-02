/**
 * @author Adam (charrondev) Charron <adam.c@vanillaforums.com>
 * @copyright 2009-2018 Vanilla Forums Inc.
 * @license https://opensource.org/licenses/GPL-2.0 GPL-2.0
 */

import React from "react";
import * as PropTypes from "prop-types";
import Quill from "quill";
import EditorToolbar from "./EditorToolbar";
import Emitter from "quill/core/emitter";
import { Range } from "quill/core/selection";

export default class InlineEditorToolbar extends React.Component {
    static propTypes = {
        quill: PropTypes.instanceOf(Quill).isRequired,
    };

    /** @type {Quill} */
    quill;

    /** @type {Object}
     * @property {boolean} isVisible - Whether or not the inline toolbar should be shown.
     * @property {number} x - X offset from the left position in pixels.
     * @property {number} y - Y offset from the top position in pixels.
     * @property {number | string} nubX - The X offset of the nub from the left of the toolbar.
     * @property {number} nubY - The y offset of the nub from the top of the toolbar.
     * */
    state;

    /** @type {HTMLElement} */
    toolbar;

    /** @type {HTMLElement} */
    nub;

    /**
     * @inheritDoc
     */
    constructor(props) {
        super(props);

        // Quill can directly on the class as it won't ever change in a single instance.
        this.quill = props.quill;

        this.state = {
            isVisible: false,
            x: 0,
            y: 0,
            nubX: "50%",
            nubY: 0,
        };

        this.handleEditorChange = this.handleEditorChange.bind(this);
    }

    /**
     * Mount quill listeners.
     */
    componentDidMount() {
        this.quill.on(Emitter.events.EDITOR_CHANGE, this.handleEditorChange);
    }

    /**
     * Be sure to remove the listeners when the component unmounts.
     */
    componentWillUnmount() {
        this.quill.off(Quill.events.EDITOR_CHANGE);
    }

    /**
     * Handle changes from the editor.
     * @param {string} type - The event type. See {quill/core/emitter}
     * @param {RangeStatic} range - The new range.
     * @param {RangeStatic} oldRange - The old range.
     * @param {Sources} source - The source of the change.
     */
    handleEditorChange(type, range, oldRange, source) {
        if (type !== Emitter.events.SELECTION_CHANGE) {
            return;
        }

        if (range && range.length > 0 && source === Emitter.sources.USER) {
            const numLines = this.quill.getLines(range.index, range.length);
            let coordinates;

            if (numLines.length === 1) {
                const bounds = this.quill.getBounds(range);

                coordinates = this.getCoordinates(bounds);
            } else {

                // If mutliline we want to position at the center of the last line's selection.
                const lastLine = numLines[numLines.length - 1];
                const index = this.quill.getIndex(lastLine);
                const length = Math.min(lastLine.length() - 1, range.index + range.length - index);
                const bounds = this.quill.getBounds(new Range(index, length));
                coordinates = this.getCoordinates(bounds);
            }

            this.setState({
                ...coordinates,
                isVisible: true,
            });
        } else {
            this.setState({
                isVisible: false,
            });
        }
    }

    /**
     * Determine position of the toolbar based on the bounds reported from quill.
     *
     * @param {BoundsStatic} bounds - The bounds to check.
     *
     * @returns {Object} - The x and y position to offset the toolbar by.
     * @property {number} x
     * @property {number} y
     * @property {number} nubX
     * @property {number} nubY
     */
    getCoordinates(bounds) {

        // Gather X positions
        const x = this.makeXCoordinates(bounds);
        const y = this.makeYCoordinates(bounds);

        return {
            x: x.toolbarPosition,
            y: y.toolbarPosition,
            nubX: x.nubPosition,
            nubY: y.nubPosition,
        };
    }

    /**
     * Calculate the X coordinates for the toolbar and it's nub.
     *
     * @param {BoundsStatic} bounds - The bounds to check.
     *
     * @returns {Object} - The X coordinates.
     * @property {number} toolbarPosition
     * @property {number} nubPosition
     */
    makeXCoordinates(bounds) {
        const containerSize = this.quill.root.offsetWidth;
        const selfSize = this.toolbar.offsetWidth;
        const nubSize = this.nub.offsetWidth;
        const padding = 12;
        const start = bounds.left;
        const end = bounds.right;

        const halfToolbarSize = selfSize / 2;
        const min = halfToolbarSize + padding;
        const max = containerSize - halfToolbarSize - padding;
        const averageOffset = Math.round((start + end) / 2);

        const toolbarPosition = Math.max(min, Math.min(max, averageOffset)) - halfToolbarSize;
        const nubPosition = averageOffset - toolbarPosition - nubSize / 2;

        return {
            toolbarPosition,
            nubPosition,
        };
    }

    /**
     * Calculate the Y coordinates for the toolbar and it's nub.
     *
     * @param {BoundsStatic} bounds - The bounds to check.
     *
     * @returns {Object} - The Y coordinates.
     * @property {number} toolbarPosition
     * @property {number} nubPosition
     */
    makeYCoordinates(bounds) {
        const offset = 6;

        let toolbarPosition = bounds.top - this.toolbar.offsetHeight - offset;
        let nubPosition = this.toolbar.offsetHeight - this.nub.offsetHeight / 2;


        const isNearStart = bounds.top < 30;
        if (isNearStart) {
            toolbarPosition = bounds.bottom + offset;
            nubPosition = 0 - this.nub.offsetHeight / 2;
        }

        return {
            toolbarPosition,
            nubPosition,
        };
    }

    /**
     * @inheritDoc
     */
    render() {
        const toolbarTranslation = {
            position: "absolute",
            top: this.state.y,
            left: this.state.x,
            zIndex: 5,
        };

        const visible = {
            visibility: "visible",
        };

        const hidden = {
            visibility: "hidden",
        };

        const toolbarStyles = {
            ...toolbarTranslation,
            ...(this.state.isVisible ? visible : hidden),
        };

        const nubStyles = {
            left: this.state.nubX,
            top: this.state.nubY,
        };

        return<div style={toolbarStyles} ref={(toolbar) => this.toolbar = toolbar }>
            <EditorToolbar quill={this.quill}/>
            <div style={nubStyles} className="richEditor-inlineNub" ref={(nub) => this.nub = nub} />
        </div>;
    }
}
