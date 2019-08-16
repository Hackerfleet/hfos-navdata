'use strict';

let humanizeDuration = require('humanize-duration');

/**
 * @ngdoc function
 * @name hfosFrontendApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the hfosFrontendApp
 */
class Monitor {

    constructor($scope, $rootscope, $stateParams, $modal, navdata, user, systemconfig, objectproxy, socket, menu, $timeout) {
        this.scope = $scope;
        this.rootscope = $rootscope;
        this.$modal = $modal;
        this.navdata = navdata;
        this.user = user;
        this.systemconfig = systemconfig;
        this.op = objectproxy;
        this.socket = socket;
        this.menu = menu;
        this.timeout = $timeout;


        this.humanize = humanizeDuration;

        this.now = new Date() / 1000;

        this.sensed = {};

        this.referencedata = {};
        this.referenceages = {};
        this.observed = [];

        this.filterIdentifier = "";
        this.filterSentence = "";
        this.filterLabel = "";
        this.filterRecording = false;
        this.filterRecordingIndeterminate = true;

        this.selected = {};
        this.selectedAll = false;

        this.dashboards = [
            {
                uuid: 'foo',
                name: 'Dashboard 1'
            },
            {
                uuid: 'bar',
                name: 'Dashbaord 2'
            }
        ];
        this.logbooks = [
            {
                uuid: 'foo',
                name: 'Logbook 1'
            },
            {
                uuid: 'bar',
                name: 'Logbook 2'
            }
        ];
        this.recording = {};

        this.hasLogbook = true;
        this.hasDashboard = true;


        let self = this;

        this.addSensorDataTypes = function(types) {
            self.sensed = {};
            self.recording = {};
            self.selected = {};
            for (let item of types) {
                self.sensed[item.uuid] = item;
                self.recording[item.uuid] = item.record;
                self.selected[item.uuid] = false;
            }
            console.log(this.recording);
        };

        this.handleNavdata = function (msg) {
            console.log('[MONITOR] Handling sensor data', msg);
            if (msg.action === 'sensed') {
                console.log('[MONITOR] Got a navdata list:', msg.data);
                if ('sensed' in msg.data) {
                    console.log('[MONITOR] Updating sensed list.');
                    self.addSensorDataTypes(msg.data.sensed);
                }
            }
        };

        this.requestSensed = function () {
            let req = {
                component: 'isomer.navdata.sensors',
                action: 'sensed'
            };

            console.log('[MONITOR] Requesting sensed list.');
            this.socket.send(req);
        };

        this.requestAll = function () {
            this.op.search('sensordatatype', '*', '*').then(function (msg) {
                self.addSensorDataTypes(msg.data.list);
            });
        };

        this.stopSubscriptions = function () {
            console.log('[MONITOR] Finally destroying all subscriptions');
            self.socket.unlisten('isomer.navdata.sensors', self.handleNavdata);
        };

        this.statechange = self.rootscope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams, options) {
                console.log('[MONITOR] States: ', toState, fromState);
                if (toState !== 'Monitor') {
                    self.stopSubscriptions();
                }
            });

        self.scope.$on('$destroy', function () {
            self.stopSubscriptions();
            $timeout.cancel(self.timeUpdater);
        });

        self.socket.listen('isomer.navdata.sensors', self.handleNavdata);
        this.requestSensed();

        this.timeUpdater = $timeout(function () {
            self.now = new Date() / 1000;
        }, 500);

        console.log('[MONITOR] Starting');
    }

    toggleRecord(item) {
        console.log('[MONITOR] Adding item to recorded values:', item);
        this.recording[item.uuid] = !this.recording[item.uuid];
        this.op.changeObject('sensordatatype', item.uuid, {
            field: 'record',
            value: this.recording[item.uuid]
        });
    }

    toggleRecordingFilter() {
        if (this.filterRecording === false) {
            this.filterRecordingIndeterminate = true;
        } else if (this.filterRecordingIndeterminate === true) {
            this.filterRecordingIndeterminate =  this.filterRecording = false;
        } else {
            this.filterRecordingIndeterminate = false;
            this.filterRecording = true;
        }
    }

    toggleSelectAll() {
        for (let item in this.selected) {
            this.selected[item] = this.selectedAll;
        }
    }

    toggleRecordSelected(state) {
        for (let uuid of Object.keys(this.selected)) {
            if (this.selected[uuid] === true) {
                let item = this.sensed[uuid];
                this.recording[uuid] = state;
                this.toggleRecord(item);
            }
        }
    }

    addSelectedLogSensorValues(logbookUuid) {
        for (let uuid of Object.keys(this.selected)) {
            if (this.selected[uuid] === true) {
                let item = this.sensed[uuid];
                console.log('[MONITOR] Adding to logbook ', item, ' to ', logbookUuid);
                this.addLogSensorValue(item, logbookUuid);
            }
        }
    }

    addSelectedDashboardSensorValues(dashboardUuid) {
        for (let uuid of Object.keys(this.selected)) {
            if (this.selected[uuid] === true) {
                let item = this.sensed[uuid];
                console.log('[MONITOR] Adding to dashboard ', item, ' to ', dashboardUuid);
                this.addDashboardSensorValue(item, dashboardUuid);
            }
        }
    }

    addLogSensorValue(item, logbookUuid) {
        console.log('[MONITOR] Adding to logbook ', item, ' to ', logbookUuid);
    }

    addDashboardSensorValue(item, logbookUuid) {
        console.log('[MONITOR] Adding to dashboard ', item, ' to ', logbookUuid);
    }

    updateObserved() {
        this.stopObserved();
        console.log('[MONITOR] Updating observed values from ', this.dashboard.cards);
        this.observed = [];
        for (let card of this.dashboard.cards) {
            console.log('[MONITOR] Inspecting card:', this.observed, card.valuetype, this.observed.indexOf(card.valuetype));
            if (this.observed.indexOf(card.valuetype) === -1) {
                console.log('[MONITOR] Adding: ', card.valuetype);
                this.observed.push(card.valuetype);
            }
        }
        console.log(this.observed);
        let request = {
            component: 'isomer.navdata.sensors',
            action: 'subscribe',
            data: this.observed
        };
        this.socket.send(request);
    }
}

Monitor.$inject = ['$scope', '$rootScope', '$stateParams', '$modal', 'navdata', 'user', 'systemconfig', 'objectproxy', 'socket', 'menu', '$timeout'];

export default Monitor;
