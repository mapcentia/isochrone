/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 *
 */
var isochrone;

/**
 *
 */
var backboneEvents;

/**
 *
 * @type {string}
 */
var exId = "isochrone";



/**
 *
 * @returns {*}
 */
module.exports = {
    set: function (o) {
        backboneEvents = o.backboneEvents;
        isochrone = o.extensions.isochrone.index;
        return this;
    },
    init: function () {

        // Click event for conflict search on/off toggle button
        // ====================================================

        $("#" + exId +"-btn").on("click", function () {
            isochrone.control();
        });

        // Listen to on event
        // ==================

        backboneEvents.get().on("on:" + exId, function () {


            // Turn info click off
            backboneEvents.get().trigger("off:infoClick");
            console.info("Starting isochrone");
        });

        // Listen to off event
        // ==================

        backboneEvents.get().on("off:" + exId, function () {


            isochrone.off();

            // Turn info click on again
            backboneEvents.get().trigger("on:infoClick");
            console.info("Stopping isochrone");
        });

    }
};