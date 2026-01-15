import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flowstate.focus',
  appName: 'Flow State',
  webDir: 'dist',
  server: {
    cleartext: true,
    allowNavigation: ['flow-state-focus.onrender.com']
  }
};

export default config;
