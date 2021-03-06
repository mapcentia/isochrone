/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 *
 * @type {*|exports|module.exports}
 */
var cloud;

/**
 *
 * @type {*|exports|module.exports}
 */
var utils;

/**
 *
 * @type {*|exports|module.exports}
 */
var layers;

/**
 *
 * @type {*|exports|module.exports}
 */
var backboneEvents;


/**
 *
 * @type {boolean}
 */
var active = false;

var mapObj;
var clicktimer;


/**
 *
 * @type {string}
 */
var exId = "isochrone";

var profiles = {
    car: {
        radius: 70,
        cellSize: 0.8,
        concavity: 3,
        lengthThreshold: 0.1,
        endpoint: "https://galton-car.gc2.io"
    },
    bicycle: {
        radius: 15,
        cellSize: 0.2,
        concavity: 3,
        lengthThreshold: 0,
        endpoint: "https://galton-bicycle.gc2.io"
    },
    foot: {
        radius: 6,
        cellSize: 0.07,
        concavity: 3,
        lengthThreshold: 0,
        endpoint: "https://galton-foot.gc2.io"
    }
};

var xhr;

/**
 *
 * @type {{set: module.exports.set, init: module.exports.init}}
 */

module.exports = module.exports = {

    /**
     *
     * @param o
     * @returns {exports}
     */
    set: function (o) {
        cloud = o.cloud;
        utils = o.utils;
        layers = o.layers;
        backboneEvents = o.backboneEvents;
        return this;
    },

    /**
     *
     */
    init: function () {

        var parentThis = this;

        /**
         *
         */
        var React = require('react');

        /**
         *
         */
        var ReactDOM = require('react-dom');

        mapObj = cloud.get().map;


        var dict = {

            "Info": {
                "da_DK": "Skab isokroner, som viser hvor du kan rejse fra et punkt inden for en vis tid. Du kan angive transportformen, såsom at gå, cykle og køre",
                "en_US": "Generate isochrones, which shows where you can travel from a point within a certain amount of time. You can specify the mode of transportation, such as walking, biking and driving"
            },

            "Isochrone": {
                "da_DK": "Transporttid",
                "en_US": "Isochrone"
            },

            "Activate": {
                "da_DK": "Aktiver",
                "en_US": "Activate"
            },

            "Mode of transportation": {
                "da_DK": "Transportform",
                "en_US": "Mode of transportation"
            },

            "Driving": {
                "da_DK": "Kørsel",
                "en_US": "Driving"
            },

            "Biking": {
                "da_DK": "Cykling",
                "en_US": "Biking"
            },

            "Walking": {
                "da_DK": "Gå",
                "en_US": "Walking"
            },

            "Minutes": {
                "da_DK": "Minutter",
                "en_US": "Minutes"
            },

            "Reach within increments of time": {
                "da_DK": "Nå inden for tidsintervaller",
                "en_US": "Reach within increments of time"
            },

            "Clear map": {
                "da_DK": "Ryd kort",
                "en_US": "Clear map"
            },


        };

        utils.createMainTab(exId, utils.__("Isochrone", dict), utils.__("Info", dict), require('./../../../browser/modules/height')().max, "timer");

        /**
         *
         */
        class Isochrone extends React.Component {
            constructor(props) {

                super(props);

                this.state = {
                    radius: profiles.car.radius,
                    cellSize: profiles.car.cellSize,
                    concavity: profiles.car.concavity,
                    lengthThreshold: profiles.car.lengthThreshold,
                    endpoint: profiles.car.endpoint,
                    type: "car"
                };


                this.infoText = {
                    margin: "15px 0 0 0"
                };

                this.noPadding = {
                    padding: "0"
                };

                this.onTransport = this.onTransport.bind(this);
                this.onClear = this.onClear.bind(this);
            }

            componentDidMount() {

                var me = this;

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

                            var coords = event.getCoordinate(), p;
                            p = utils.transform("EPSG:3857", "EPSG:4326", coords);

                            var intervals = Array.from(
                                document.querySelectorAll('.intervals input[type="checkbox"]:checked')
                            ).map(function (el) {
                                return el.value
                            });
                            var params = {
                                lng: p.x,
                                lat: p.y,
                                radius: me.state.radius,
                                deintersect: true,
                                cellSize: me.state.cellSize,
                                concavity: me.state.concavity,
                                lengthThreshold: me.state.lengthThreshold,
                                units: "kilometers"
                            };

                            try {
                                parentThis.clear();
                            } catch (e) {
                                console.error(e.message)
                            }

                            layers.incrementCountLoading("_vidi_isochrone");
                            backboneEvents.get().trigger("startLoading:layers");

                            mapObj.addLayer(parentThis.gridSource);
                            mapObj.addLayer(parentThis.pointLayer);
                            parentThis.pointLayer.addLayer(
                                L.circleMarker([p.y, p.x], {
                                    color: '#ffffff',
                                    fillColor: '#000000',
                                    opacity: 1,
                                    fillOpacity: 1,
                                    weight: 3,
                                    radius: 12,
                                    clickable: false
                                })
                            );

                            var url = new URL(me.state.endpoint);

                            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

                            (intervals.length > 0 ? intervals : [10, 20, 30]).forEach(interval => url.searchParams.append('intervals', interval));

                            parentThis.request(url.toString());

                        }, 250);
                    }
                });
            }

            onTransport(e) {
                profiles[e.currentTarget.value].type = e.currentTarget.value;
                this.setState(profiles[e.currentTarget.value]);
            }

            onClear(e) {
                parentThis.clear();
            }

            render() {
                return (

                    <div role='tabpanel'>
                        <form className="form-horizontal">
                            <fieldset>
                                <div className="togglebutton">
                                    <label><input id="isochrone-btn"
                                                  type="checkbox"/>{utils.__("Activate", dict)}
                                    </label>
                                </div>
                            </fieldset>

                            <div className="row" style={this.infoText}>
                                <div className="col-md-12" style={this.noPadding}>
                                    <h4>{utils.__("Mode of transportation", dict)}</h4>
                                </div>
                            </div>

                            <fieldset>
                                <div className="radio col-md-4">
                                    <label>
                                        <input onClick={this.onTransport} type="radio"
                                               name="transport" value="car"
                                               defaultChecked="1"/>{utils.__("Driving", dict)}
                                    </label>
                                </div>
                                <div className="radio col-md-4">
                                    <label>
                                        <input onClick={this.onTransport} type="radio"
                                               name="transport"
                                               value="bicycle"/>{utils.__("Biking", dict)}
                                    </label>
                                </div>
                                <div className="radio col-md-4">
                                    <label>
                                        <input onClick={this.onTransport} type="radio"
                                               name="transport"
                                               value="foot"/>{utils.__("Walking", dict)}
                                    </label>
                                </div>

                            </fieldset>

                            <div className="row" style={this.infoText}>
                                <div className="col-md-12" style={this.noPadding}>
                                    <h4>{utils.__("Reach within increments of time", dict)}</h4>
                                </div>
                            </div>

                            <fieldset className='intervals'>
                                <div className="checkbox col-md-4">
                                    <label>
                                        <input id="i10" type="checkbox"
                                               defaultChecked='defaultChecked'
                                               defaultValue='10'/>10 {utils.__("Minutes", dict)}
                                    </label>
                                </div>

                                <div className="checkbox col-md-4">
                                    <label>
                                        <input id="i20" type="checkbox"
                                               defaultChecked='defaultChecked'
                                               defaultValue='20'/>20 {utils.__("Minutes", dict)}
                                    </label>
                                </div>

                                <div className="checkbox col-md-4">
                                    <label>
                                        <input id="i30" type="checkbox"
                                               defaultChecked='defaultChecked'
                                               defaultValue='30'/>30 {utils.__("Minutes", dict)}
                                    </label>
                                </div>
                            </fieldset>

                            <fieldset style={this.infoText}>
                                <button onClick={this.onClear} type="button"
                                        className="btn btn-raised">{utils.__("Clear map", dict)}</button>
                            </fieldset>

                        </form>

                    </div>


                );
            }
        }

        // Append to DOM
        //==============

        try {
            ReactDOM.render(
                <Isochrone/>,
                document.getElementById(exId)
            );
        } catch (e) {

        }

    },

    request: function (url) {
        var me = this;
        return new Promise(function (resolve, reject) {
            xhr = $.ajax({
                dataType: 'json',
                url: url,
                type: "GET",
                success: function (data) {
                    resolve(data);
                    me.gridSource.addData(data);
                },
                error: function () {
                    reject();
                    console.error(error);

                },
                complete: function () {
                    layers.decrementCountLoading("_vidi_isochrone");
                    backboneEvents.get().trigger("doneLoading:layers");
                }

            });
        })
    },

    pointLayer: new L.FeatureGroup(),

    gridSource: new L.GeoJSON(null, {
        style: function (feature) {
            return {
                fillColor: (function getColor(d) {
                    return d > 30 ? '#00aaFF' :
                        d > 25 ? '#00aaFF' :
                            d > 20 ? '#00aaFF' :
                                d > 15 ? '#00aaFF' :
                                    d > 10 ? '#00aaFF' :
                                        '#00aaFF';
                }(feature.properties.time)),
                weight: 0,
                opacity: 0,
                fillOpacity: (function getColor(d) {
                    return d > 30 ? '0.2' :
                        d > 25 ? '0.3' :
                            d > 20 ? '0.4' :
                                d > 15 ? '0.5' :
                                    d > 10 ? '0.6' :
                                        '0.8';
                }(feature.properties.time))
            }
        },
        clickable: false
    }),

    clear: function () {
        this.gridSource.clearLayers();
        this.pointLayer.clearLayers();
        mapObj.removeLayer(this.pointLayer);
        mapObj.removeLayer(this.gridSource);
        try {
            xhr.abort();
        } catch (e) {

        }
    },

    /**
     *
     */
    control: function () {
        if ($("#" + exId + "-btn").is(':checked')) {

            // Emit "on" event
            //================

            backboneEvents.get().trigger("on:" + exId);

            utils.cursorStyle().crosshair();

            active = true;

        } else {

            // Emit "off" event
            //=================

            backboneEvents.get().trigger("off:" + exId);

            utils.cursorStyle().reset();

            active = false;

        }
    },


    /**
     *
     */
    off: function () {
        this.clear();
    }

};
