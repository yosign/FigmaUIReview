# Figma UI Review Plugin

A powerful Figma plugin for UI review and quality assurance. This plugin helps designers and developers ensure consistency and quality in their UI designs by providing automated checks for layout, styling, and naming conventions.

## Features

- 🎯 Automated UI checks
- 🎨 Style consistency validation
- 📏 Layout inspection
- 🏷️ Naming convention verification
- 🔍 Real-time feedback
- 🛠️ Quick-fix suggestions

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/figma-ui-review.git
cd figma-ui-review
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build the plugin:
```bash
npm run build
```

## Project Structure

```
figma-ui-review/
├── src/                    # Next.js frontend code
│   ├── app/               # App router components
│   ├── components/        # Shared components
│   └── lib/               # Utilities and helpers
├── plugin-src/            # Figma plugin code
│   └── controller/        # Plugin controller
├── dist/                  # Build output
└── public/                # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Figma Plugin API
- Next.js
- Tailwind CSS
- TypeScript

Below are the steps to get your plugin running. You can also find instructions at:

  https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

  https://nodejs.org/en/download/

Next, install TypeScript using the command:

  npm install -g typescript

Finally, in the directory of your plugin, get the latest type definitions for the plugin API by running:

  npm install --save-dev @figma/plugin-typings

If you are familiar with JavaScript, TypeScript will look very familiar. In fact, valid JavaScript code
is already valid Typescript code.

TypeScript adds type annotations to variables. This allows code editors such as Visual Studio Code
to provide information about the Figma API while you are writing code, as well as help catch bugs
you previously didn't notice.

For more information, visit https://www.typescriptlang.org/

Using TypeScript requires a compiler to convert TypeScript (code.ts) into JavaScript (code.js)
for the browser to run.

We recommend writing TypeScript code using Visual Studio code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/.
2. Open this directory in Visual Studio Code.
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
    then select "npm: watch". You will have to do this again every time
    you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.
