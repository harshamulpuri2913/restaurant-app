# Contributing to Sai Datta Restaurant App

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/restaurant-app.git
   cd restaurant-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment template:
   ```bash
   cp .env.example .env
   ```
5. Set up database:
   ```bash
   npm run db:generate
   npm run db:push
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/add-payment-gateway`)
- `fix/` - Bug fixes (e.g., `fix/cart-total-calculation`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/optimize-queries`)

### Creating a Feature

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Test thoroughly
4. Commit with meaningful messages
5. Push and create a pull request

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Add JSDoc comments for functions
- Use meaningful variable names

### File Structure

```
app/
├── api/           # API routes
├── [page]/        # Page components
│   └── components/ # Page-specific components
components/
├── ui/            # Reusable UI components
lib/
├── hooks/         # Custom React hooks
types/             # TypeScript type definitions
```

### Component Guidelines

- Keep components under 500 lines
- Extract reusable logic to custom hooks
- Use TypeScript interfaces for props
- Add comments for complex logic

### API Route Guidelines

- Use proper HTTP methods (GET, POST, PATCH, DELETE)
- Validate all inputs
- Return appropriate status codes
- Include error messages

## Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples

```
feat(cart): add quantity update functionality
fix(orders): correct total calculation for variants
docs(readme): update installation instructions
refactor(api): extract auth utilities to lib
```

## Pull Requests

### Before Submitting

- [ ] Code follows existing style
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] No console errors
- [ ] Changes are documented

### PR Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
[How did you test these changes?]

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

### Review Process

1. Submit PR with description
2. Wait for code review
3. Address feedback
4. Get approval
5. Merge

## Questions?

If you have questions, open an issue or contact the development team.

---

Thank you for contributing! 🙏

