# Contributing to WorldFace

Thank you for your interest in contributing to WorldFace! We welcome contributions from everyone — whether you're fixing bugs, adding features, improving documentation, or helping with testing.

## Who can contribute?

Anyone can contribute to WorldFace. You don't need special permissions or prior experience with the project. If you're new to open source, this is a great place to start.

## Types of contributions we welcome

- **Bug reports** — Found an issue? Let us know with details about how to reproduce it
- **Feature suggestions** — Have an idea for an improvement? Share it with the community
- **Code contributions** — Write code to fix bugs or implement features
- **Documentation** — Improve README, guides, code comments, or inline docs
- **Testing** — Help test new features and report edge cases
- **Design feedback** — Suggest UI/UX improvements
- **Community engagement** — Help answer questions, mentor others, or organize discussions

## Getting started

### Set up your development environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/worldface-magic-portals.git
   cd worldface-magic-portals
   ```
3. Add upstream remote to stay synced:
   ```bash
   git remote add upstream https://github.com/chitale335/worldface-magic-portals.git
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Finding something to work on

- **Look at open issues** — Check [Issues](https://github.com/chitale335/worldface-magic-portals/issues) for tasks labeled `good first issue` or `help wanted`
- **Start small** — Documentation fixes and small bug fixes are great starting points
- **Open a discussion** — If you want to work on a major feature, open an issue first to discuss the approach
- **Check existing PRs** — Avoid duplicating work already in progress

## Making changes

### Code style

- Use TypeScript for all new code
- Follow the existing code structure and patterns in the repository
- Use ESLint to check your code:
  ```bash
  npm run lint
  ```
- Format code consistently with the project conventions (TailwindCSS for styling, React hooks patterns)

### Testing your changes

- Run tests to ensure nothing breaks:
  ```bash
  npm run test
  ```
- Test your changes locally:
  ```bash
  npm run dev
  ```
- For UI changes, test on different screen sizes if relevant
- Add tests for new functionality when possible

### Commit messages

Write clear, descriptive commit messages:

- Start with a verb: "Add", "Fix", "Update", "Refactor", "Docs"
- Be specific about what changed
- Keep the first line under 72 characters
- Reference relevant issues: "Fixes #123"

Examples:
- `Fix login form validation error`
- `Add cultural mentor feature`
- `Update contributing guidelines`
- `Refactor wallet component for clarity`

### Pull requests

1. **Keep PRs focused** — One feature or fix per pull request
2. **Write a clear description** — Explain what changed and why
3. **Link related issues** — Use "Fixes #123" to auto-link issues
4. **Be responsive to feedback** — Address review comments promptly
5. **Wait for approval** — At least one maintainer must review and approve

### Pull request checklist

Before submitting, ensure:

- [ ] Your branch is up to date with `main`
- [ ] Code passes linting (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] Changes are documented (README, code comments, etc.)
- [ ] No sensitive information (keys, passwords, credentials) is included
- [ ] Commit messages are clear and descriptive

## Security and privacy

### Never commit secrets

- API keys, tokens, passwords, OAuth secrets, database credentials, or private keys
- Use environment variables for sensitive configuration
- Never commit `.env` files or any files containing credentials
- If you accidentally commit a secret, report it immediately

### Security vulnerabilities

- Do not open public issues for security vulnerabilities
- Use GitHub's private security reporting mechanism
- See [SECURITY.md](./SECURITY.md) for detailed instructions

## Code review process

1. **Submit your PR** with a clear description
2. **Automatic checks run** — Tests, linting, and code quality
3. **Maintainer reviews** — Code review and feedback
4. **Make requested changes** — Address review comments
5. **Approval and merge** — Your PR is merged once approved

## Questions or need help?

- **Ask in Issues** — Open an issue and ask your question (tag with `question`)
- **Start a Discussion** — Use GitHub Discussions for ideas and general questions
- **Code review comments** — Maintainers will help explain feedback on your PR
- **Community** — Community members may help with answers and guidance

## License

By contributing to WorldFace, you agree that your contributions will be licensed under the [MIT License](./LICENSE). This ensures WorldFace remains open-source and freely available.

## Code of Conduct

Please review and follow our [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). We're committed to providing a welcoming and inclusive environment for all contributors.

---

Thank you for contributing to WorldFace! Your help makes this project better for everyone. 🌍
