import icon from './assets/noun_meter_1692403.svg';


export function routing($stateProvider) {

    $stateProvider
        .state('app.navmonitor', {
            url: '/navmonitor',
            template: '<navmonitor></navmonitor>',
            label: 'Sensor Monitor',
            icon: icon
        });
}
