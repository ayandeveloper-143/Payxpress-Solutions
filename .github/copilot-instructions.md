# Copilot Instructions

This file encodes the coding style and conventions of this repository so that GitHub Copilot generates code that matches how this project is written.

---

## Project Overview

This is a **full-stack TypeScript monorepo** containing:
- **Frontend** (root): React 18 + Vite + Tailwind CSS + Shadcn UI — single-page e-commerce application
- **Backend** (`api-source/`): Express.js + MySQL2 + JWT — REST API

---

## Language & TypeScript

- All code is written in **TypeScript** (`.ts` / `.tsx`). Never generate plain JavaScript.
- **Frontend** uses `strict: false` (loose mode) — do not add unnecessary type annotations where TypeScript can infer them.
- **Backend** uses `strict: true` — all types must be explicit and complete.
- Use **`type` imports** when only importing a type: `import type { Foo } from "..."`.
- Use **`.js` extensions** on all relative imports in the backend (`api-source/`), because it uses `NodeNext` module resolution.
- Use **`@/` path alias** for all relative imports in the frontend (e.g. `import { useAuth } from "@/context/AuthContext"`).

---

## Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Interfaces | PascalCase, descriptive suffix | `AuthContextType`, `LoginFormProps`, `ProductRecord` |
| Types / aliases | PascalCase | `AccessTokenPayload`, `AuthFormType` |
| Functions & variables | camelCase | `loadUserFromStorage`, `cartItems` |
| Constants (module-level, semantically constant) | UPPER_SNAKE_CASE | `CART_STORAGE_KEY`, `CUSTOM_SUPPORT_SLUG` |
| React components | PascalCase | `LoginForm`, `ProductCard` |
| Files (components/pages) | PascalCase | `AuthContext.tsx`, `LoginForm.tsx` |
| Files (utilities/services) | kebab-case | `auth-mail.service.ts`, `email-templates/` |
| Database column names | snake_case | `price_label`, `cart_limit`, `order_history` |
| API response / TS object keys | camelCase | `cartLimit`, `orderHistory` |

---

## Interfaces vs Types

- **Use `interface`** for:
  - React component props (`interface LoginFormProps { ... }`)
  - React Context shapes (`interface AuthContextType { ... }`)
  - API request/response contracts (`interface LoginResponse { ... }`)
  - Database record shapes (extend `RowDataPacket` from mysql2)
- **Use `type`** for:
  - Union types (`type AuthFormType = "login" | "signup" | "forgot"`)
  - Internal, non-extensible records (`type AccessTokenPayload = { ... }`)
  - Inferred schema types (`type LoginFormValues = z.infer<typeof loginSchema>`)

---

## React Patterns (Frontend)

- Use **functional components only** — never class components.
- Type components as `React.FC<Props>` when the component accepts props.
- Use **React Context API** for all shared state (no Redux, no Zustand).
  - Each context file exports: the provider component, the hook (`useXxx`), and the context types.
  - The custom hook must throw if used outside its provider.
- Use **`useState`** with lazy initializers for state derived from storage:
  ```ts
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);
  ```
- Use **`useEffect`** for side effects on mount. Keep effect callbacks small and delegate to named async helpers.
- Manage loading state with a dedicated boolean flag (`isAuthLoading`, `isLoading`).

---

## Forms (Frontend)

- All forms use **React Hook Form** + **Zod** via `@hookform/resolvers/zod`.
- Define the schema first, then infer the form values type:
  ```ts
  const loginSchema = z.object({ ... });
  type LoginFormValues = z.infer<typeof loginSchema>;
  ```
- Use `form.setError(field, { type: "server", message })` to apply server-side field errors.
- Always call `form.clearErrors()` before submitting.
- Use Shadcn UI's `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>` components for consistent UI.

---

## Error Handling

### Frontend
- The `ApiRequestError` class (in `src/lib/api.ts`) is the single error type for all API failures. Always `instanceof` check against it.
- Catch errors in `try/catch/finally` blocks; always reset loading state in `finally`.
- Show user-visible errors via the `useToast` hook with `variant: "destructive"` for errors.
- Map specific `error.field` values back to form field errors using `form.setError`.

### Backend
- Return early with `response.status(xxx).json({ message: "..." })` for guard checks — do not use exceptions for flow control.
- Use the global error middleware (`errorHandler`) for unexpected errors; it logs to `console.error` and returns `500`.
- Validate all incoming request bodies with **Zod** schemas (`signupSchema.parse(request.body)`). Let Zod validation errors propagate to the error middleware.

---

## Async / Await

- Always use `async/await` — never `.then()/.catch()` chains (except for fire-and-forget calls like `logoutUser().catch(() => {})`).
- Name async helper functions clearly: `refreshUser`, `fetchProducts`, `sendSignupVerificationEmail`.
- In Express controllers, the function signature is always:
  ```ts
  export const myController = async (request: Request, response: Response) => { ... };
  ```
- Guard against missing tokens and invalid payloads at the top of each controller, returning early with the appropriate HTTP status.

---

## API Client (Frontend — `src/lib/api.ts`)

- All API calls go through the single generic `request<T>` function.
- Add new API functions as named exports at the bottom of the file in the form:
  ```ts
  export const doSomething = (payload: DoSomethingPayload) =>
    request<DoSomethingResponse>("/path", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      requiresAuth: true,
    });
  ```
- Define request payload and response interfaces in the same file, near the function that uses them.

---

## Backend Architecture

Follow the **controller → route → service** layered pattern:

1. **`controllers/`** — Handle the HTTP request/response cycle. Validate input, call helpers or DB directly, and format the response. Keep controllers focused; extract reusable logic into named helper functions within the same file.
2. **`routes/`** — Register controllers on Express routers. One route file per domain (auth, payment, product, cart, admin, bills, contact, health).
3. **`services/`** — Side-effect-heavy integrations (email via Nodemailer, PDF generation). Exported as named async functions; never expose the internal `transporter` or low-level primitives.
4. **`config/`** — `env.ts` for typed environment variables (use helper functions `toNumber`, `toBoolean` to coerce values), `db.ts` for the MySQL connection pool.
5. **`types/`** — Shared TypeScript interfaces and module declarations. Database record types extend `RowDataPacket`.
6. **`middleware/`** — Express middleware only (e.g., error handler). Keep it thin.

---

## Validation (Backend)

- Define Zod schemas at the top of the controller file, outside the handler function.
- Use `schema.parse()` (throws on failure) for request bodies — do **not** use `schema.safeParse()` unless you need to handle partial errors.
- Field names in schemas use camelCase matching the API contract, not the database column names.

---

## Database (Backend)

- Use the `db` connection pool from `config/db.js` directly inside controllers (no ORM, no repository layer).
- Always use parameterised queries with `?` placeholders to prevent SQL injection.
- Prefer `db.execute()` for INSERT/UPDATE/DELETE and `db.query<RowType[]>()` for SELECT.
- Database column names are `snake_case`; map them to `camelCase` before returning from the API.

---

## Import Order & Style

Maintain this order (separated by a blank line):

1. Node built-ins (backend only)
2. Third-party packages
3. Internal aliases (`@/...` on frontend, `../config/...` etc. on backend)
4. Relative imports from the same directory

Prefer **named exports** over default exports for utilities, hooks, context values, and controllers. Use **default exports** only for React page components (as expected by React Router).

---

## Styling (Frontend)

- Use **Tailwind CSS** utility classes exclusively — no custom CSS files.
- Compose class names using `cn()` from `@/lib/utils` (wraps `clsx` + `tailwind-merge`).
- Use **Shadcn UI** components from `@/components/ui/` for all base UI elements (Button, Input, Dialog, Form, etc.).
- Responsive design is mobile-first; use `sm:`, `md:`, `lg:` breakpoints.

---

## Testing (Frontend)

- Test framework: **Vitest** + **@testing-library/react** + **@testing-library/user-event**.
- Test files live in `src/test/` mirroring the source structure.
- Mock external modules at the top of the file with `vi.mock(...)`.
- Wrap async state updates in `act(async () => { ... })`.
- Use `localStorage.clear()` and `vi.clearAllMocks()` in `beforeEach`.
- Test observable behaviour (DOM output, localStorage state, function calls) — not internal implementation details.
- Each `describe` block tests a single unit; `it` descriptions read as plain English sentences.

---

## General Conventions

- Prefer **immutable updates** — use spread operators and `Array.map/filter` instead of mutating objects in place.
- Write **small, named helper functions** for non-trivial logic rather than inline expressions.
- Use **optional chaining** (`?.`) and **nullish coalescing** (`??`) instead of verbose null checks.
- Avoid `any` in backend code (`strict: true`); use `unknown` with narrowing instead.
- Keep files focused: if a file grows beyond ~300 lines, consider splitting it.
- No decorators — the project does not use NestJS or class-based patterns.
- Currency amounts are formatted as Indian Rupee (`₹`) using `toLocaleString("en-IN")`.
