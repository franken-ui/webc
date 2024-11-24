# Franken UI - Web Components

This is a project designed to complement UIkit, filling in the gaps with the missing components of Franken UI.

## Documentation

- [Version 2](https://next.franken-ui.dev) (latest)
- [Version 1](https://franken-ui.dev)

## Sponsors

Franken UI is an independent, MIT-licensed open source project with its ongoing development made possible entirely by the support of the community. If Franken UI has been beneficial to you in any way, please consider contributing by making a donation, which will help maintain and improve it for the benefit of everyone.

Thanks to the following:

<p align="center">
  <a target="_blank" href="https://atuin.sh">
    <img alt="Atuin" src="https://next.franken-ui.dev/images/sponsors/atuin.png" width="300" />
  </a>
</p>

And the amazing individuals from [Ko-Fi](https://ko-fi.com/sveltecult) who helped it since day one.

## Development

Code contributions are now accepted from the community. To ensure effective collaboration and minimize potential conflicts, contributors are requested to reach out before starting work on any new features or bug fixes. This allows discussion of proposed changes, guidance on project architecture and coding standards, and ensures all contributions align with the project's overall vision.

To get started with development, please follow these steps:

* Clone the following three repositories into a single directory: [franken-ui/ui](https://github.com/franken-ui/ui), [franken-ui/uikit](https://github.com/franken-ui/uikit), and [franken-ui/webc](https://github.com/franken-ui/webc).
* Navigate to the `uikit` directory and run the following commands:
  * `npm install`
  * `npm run compile-js`
  * `npm link`
* Next, navigate to the `ui` directory and run the following commands:
  * `npm install`
  * `npm run package`
  * `npm link`
* Finally, navigate to the `webc` directory and run the following commands:
  * `npm install`
  * `npm link franken-ui uikit`
  * `npm link`
* You are now ready to begin developing Franken UI.

## License

Licensed under the [MIT license](https://github.com/franken-ui/webc/blob/master/LICENSE.md).