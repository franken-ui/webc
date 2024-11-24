import config from './config.js';

const conf = config(
  { margin: true },
  {
    safelist: [{ pattern: /./, variants: ['sm', 'md', 'lg', 'xl'] }],
  },
);

export default conf;
