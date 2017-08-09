/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 *
 */
var cloud;


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

var clicktimer;

/**
 *
 * @type {boolean}
 */
var active = false;


/**
 *
 * @returns {*}
 */
module.exports = {
    set: function (o) {
        cloud = o.cloud;
        backboneEvents = o.backboneEvents;
        isochrone = o.extensions.isochrone.index;
        return this;
    },
    init: function () {

        var mapObj = cloud.get();

        // Click event for conflict search on/off toggle button
        // ====================================================

        $("#" + exId +"-btn").on("click", function () {
            isochrone.control();
        });

        // Listen to on event
        // ==================

        backboneEvents.get().on("on:" + exId, function () {

            active = true;

            // Turn info click off
            backboneEvents.get().trigger("off:infoClick");
            console.info("Starting isochrone");
        });

        // Listen to off event
        // ==================

        backboneEvents.get().on("off:" + exId, function () {

            active = false;

            isochrone.off();

            // Turn info click on again
            backboneEvents.get().trigger("on:infoClick");
            console.info("Stopping isochrone");
        });

        // Handle click events on map
        // ==========================

        mapObj.on("dblclick", function () {
            clicktimer = undefined;
        });
        mapObj.on("click", function (e) {
            var event = new geocloud.clickEvent(e, cloud);
            if (clicktimer) {
                clearTimeout(clicktimer);
            }
            else {
                if (active === false) {
                    return;
                }

                clicktimer = setTimeout(function (e) {
                    clicktimer = undefined;
                    isochrone.click(event);




                }, 250);
            }
        });

    }
};