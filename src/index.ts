import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { Zigbee2MqttOsramPlatform } from './platform';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, Zigbee2MqttOsramPlatform);
};
