import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flowstate.focus',
  appName: 'Flow State',
  webDir: 'dist',
  server: {
    cleartext: true,
    allowNavigation: ['10.238.71.15']
  }
};

export default config;
