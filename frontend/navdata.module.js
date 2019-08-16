import './navdata/navdata.scss';

import angular from 'angular';
import uirouter from 'angular-ui-router';

import {routing} from './navdata.config.js';

import NavDataService from './navdata/navdata.js';
import MonitorController from './navdata/monitor.js';
import MonitorTemplate from './navdata/monitor.tpl.html';

export default angular
    .module('main.app.navdata', [uirouter])
    .config(routing)
    .service('navdata', NavDataService)
    .component('navmonitor', {controller: MonitorController, template: MonitorTemplate})
    .name;
