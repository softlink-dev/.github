# GitHub Copilot Instructions for Code Review

## 🏗 General Architecture Guidelines

* For new code and major refactors, follow **three-tier architecture**:

  * **UI Layer** (e.g., ASPX, React, MVC Controllers)
  * **Business Logic Layer** (e.g., Services, Validators)
  * **Data Access Layer** (e.g., ADO.NET, Dapper, Entity Framework, Stored Procedures)

* No direct database access from UI or controllers.
* Follow **Single Responsibility Principle (SRP)** — each class or method should do only one thing.
* Use **Dependency Injection (DI)** for services and repositories.
* Use **AutoMapper** for model-to-DTO mapping.
* Keep cross-layer concerns (e.g., logging, caching) modular.

## 💻 C# Coding Standards

* Use `async/await` for all I/O-bound operations.
* Wrap database access in `using` blocks to ensure proper disposal.
* Avoid try-catch in every method — handle exceptions at boundary layers.
* Use `readonly` for fields wherever possible.
* Apply **early returns** to reduce nesting and improve readability.
* Limit method length to **≤ 30 lines**; extract sub-methods where needed.
* Use `ILogger<T>` for structured logging — avoid `Console.WriteLine`.
* Prefer `var` when the type is clear; use explicit types for readability otherwise.
* Favor **pattern matching** and **switch expressions** when applicable.

## 🧾 Naming Conventions — C#

* **Projects/Repos:** `kebab-case` (e.g., `logisys-accounts-core`)
* **Classes \& Public Methods:** `PascalCase` (e.g., `CustomerManager`, `CalculateInvoiceTotal`)
* **Private/Local Variables \& Methods:** `camelCase`
* **Protected/Private Fields:** `\\\_camelCase` (e.g., `\\\_userRepo`)
* **Constants:** `UPPER\\\_SNAKE\\\_CASE` (e.g., `MAX\\\_RETRY\\\_ATTEMPTS`)

## 🧠 Naming Conventions — JavaScript / React

* **Components:** `PascalCase` (e.g., `CustomerCard`)
* **Functions/Variables/State Hooks:** `camelCase`

  * `const \\\[userList, setUserList] = useState(\\\[])`

* **CSS/SCSS Classes:** `kebab-case` (e.g., `invoice-header`)
* **Constants:** `UPPER\\\_SNAKE\\\_CASE`
* **File Naming:**

  * Components: `ComponentName.js`
  * Hooks: `useXyz.js`
  * Utils: `someUtility.js`

* Avoid single-letter or contextless names (`x`, `tmp`, `d`).

## 🔍 Code Review Heuristics

### 1\. Single Responsibility Principle (SRP)

* Flag methods doing multiple things (e.g., validation + DB + formatting).
* Long methods (>30 lines) often indicate SRP violations.

### 2\. Method Structure \& Length

* Flag methods exceeding 30 lines.
* Recommend logical sub-methods.
* Use early exits where possible.
* Ensure **all statements in a method maintain the same level of abstraction**.  
  High-level orchestration methods should delegate tasks to sub-methods rather than mixing in low-level logic. This improves readability and makes the method’s intent clearer.

### 3\. DRY Principle

* Flag repeated logic blocks.
* Suggest private methods or utilities.
* Identify duplicated code across layers or files.

### 4\. Naming Quality

* Flag cryptic or overly verbose names.
* Ensure names reflect intent and follow conventions.
* Avoid undocumented abbreviations.

### 5\. Null Safety \& Defensive Coding

* Flag missing null checks in shared/public methods.
* Use `?.`, `??`, and null guards appropriately.

### 6\. Magic Values

* Flag hardcoded literals (e.g., `if (code == 7)`).
* Move them to constants or enums.

### 7\. Exception Handling

* Flag empty `catch {}` blocks.
* Recommend logging and meaningful error propagation.

### 8\. Code Comments \& Readability

* Encourage comments that explain **why**, not **what**.
* Remove commented-out code unless justified and noted.

### 9\. Dead Code

* Identify unused variables, methods, or legacy blocks.
* Recommend deletion for cleaner code.

### 10\. Testability

* Flag tightly coupled logic that's hard to test.
* Recommend interface-driven design for unit testing.

## 🖥 UI / Front-End Guidelines

* Use **React functional components with hooks**.
* Use `className` in JSX (not `class`).
* Keep forms **controlled** using state.
* Extract shared logic into **custom hooks**.
* Avoid inline styles unless unavoidable.
* Use **modular CSS**, **SCSS**, or **Tailwind CSS**.
* Separate reusable components into their own files.
* Use semantic HTML and accessibility attributes.
* Write tests using **React Testing Library** and **Jest**.

## 🌐 Localization \& Constants

* Do not hardcode labels, errors, or messages.
* Use `.resx` files or centralized config/constants.
* Use enums or static constants for logic-related values.

## 🧾 Feedback Format (for Chat or Review Tools)

* Use Markdown sections for clarity:

  * `## SRP Violation`
  * `## Naming Issue`
  * `## DRY Violation`, etc.

* Keep feedback technical, concise, and actionable.
* Quote or reference exact code lines where helpful.

### 💬 Example Feedback Block

```markdown
## SRP Violation
The method `ProcessShipmentAndNotify()` performs three distinct tasks: 
- Updates DB
- Sends notification
- Logs result

Refactor into:
- `UpdateShipmentStatus()`
- `SendCustomerNotification()`
- `LogProcessingResult()`


