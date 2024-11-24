import merge from 'lodash/merge.js';
import plugins from './plugins.js';

export default function config(corePlugins, conf) {
  return merge(
    {
      corePlugins: merge(plugins, corePlugins),
      content: [],
      theme: {
        extend: {},
      },
      plugins: [],
    },
    conf,
  );
}
