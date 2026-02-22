import Link from "next/link";

export default function WorkflowsPage() {
    const workflows = [
        { cmd: "/brainstorm", desc: "Structured brainstorming for projects and features. Explores multiple options before implementation.", usage: "/brainstorm authentication system" },
        { cmd: "/create", desc: "Create new application command. Triggers App Builder skill and starts interactive dialogue with user.", usage: "/create landing page with hero section" },
        { cmd: "/debug", desc: "Activates DEBUG mode for systematic problem investigation using 4-phase methodology.", usage: "/debug why login fails" },
        { cmd: "/deploy", desc: "Deployment command for production releases. Pre-flight checks and deployment execution.", usage: "/deploy to production" },
        { cmd: "/enhance", desc: "Add or update features in existing application. Used for iterative development.", usage: "/enhance add dark mode" },
        { cmd: "/orchestrate", desc: "Coordinate multiple agents for complex tasks. Use for multi-perspective analysis.", usage: "/orchestrate design system audit" },
        { cmd: "/plan", desc: "Create project plan using project-planner agent. Only generates plan file, no code.", usage: "/plan new authentication feature" },
        { cmd: "/preview", desc: "Preview server start, stop, and status check. Local development server management.", usage: "/preview start" },
        { cmd: "/status", desc: "Display  agent and project status. Progress tracking and status board.", usage: "/status" },
        { cmd: "/test", desc: "Test generation and test running command. Creates and executes tests for code.", usage: "/test authentication service" },
        { cmd: "/ui-ux-pro-max", desc: "Plan and implement UI with 50 styles, 21 palettes, 50 font pairings.", usage: "/ui-ux-pro-max design dashboard" },
    ];

    return (
        <div className="max-w-3xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                <Link href="/docs" className="hover:text-zinc-900 dark:hover:text-zinc-50">Docs</Link>
                <span>/</span>
                <span className="text-zinc-900 dark:text-zinc-50">Workflows</span>
            </nav>

            {/* Page Header */}
            <div className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    Workflows
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                    Slash command procedures for common development tasks.
                </p>
            </div>

            {/* What are Workflows */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    What are Workflows?
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-4">
                    Workflows are well-defined, step-by-step procedures for achieving specific development tasks. They're invoked using slash commands and provide consistent, repeatable processes.
                </p>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">
                    Each workflow contains specific instructions, decision points, and best practices for its domain.
                </p>
            </section>

            {/* How to Use */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    How to Use Workflows
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">
                    Simply type a slash command followed by your task description:
                </p>

                <div className="relative group mb-6">
                    <pre className="p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950 overflow-x-auto border border-zinc-800 font-mono text-sm">
                        <code className="text-zinc-100">{`/brainstorm authentication system
/create landing page with hero section
/debug why login fails`}</code>
                    </pre>
                </div>

                <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                        <strong className="font-semibold">Tip:</strong> Some workflows have a <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 font-mono text-xs">// turbo</code> annotation that allows auto-running safe commands without user approval.
                    </p>
                </div>
            </section>

            {/* Available Workflows */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    Available Workflows
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">
                    {workflows.length} workflows covering common development scenarios:
                </p>

                <div className="space-y-6">
                    {workflows.map((workflow) => (
                        <div
                            key={workflow.cmd}
                            className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <code className="text-lg font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                                    {workflow.cmd}
                                </code>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
                                {workflow.desc}
                            </p>
                            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-2">
                                    Example Usage
                                </div>
                                <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded">
                                    {workflow.usage}
                                </code>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Creating Custom Workflows */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    Creating Custom Workflows
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">
                    You can create your own workflows by adding markdown files to <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm font-mono">.agent/workflows/</code>:
                </p>

                <div className="relative group mb-6">
                    <pre className="p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950 overflow-x-auto border border-zinc-800 font-mono text-sm">
                        <code className="text-zinc-100">{`---
description: Deploy application to staging
---

# Deployment Workflow

1. Run tests
2. Build production bundle
3. Deploy to staging server
4. Verify deployment`}</code>
                    </pre>
                </div>

                <p className="text-base text-zinc-600 dark:text-zinc-400">
                    Save as <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm font-mono">.agent/workflows/deploy-staging.md</code> and invoke with <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-sm font-mono">/deploy-staging</code>.
                </p>
            </section>

            {/* Next Steps */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    Next Steps
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/docs/cli"
                        className="group p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">CLI Reference →</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Learn about command-line tools
                        </p>
                    </Link>
                    <Link
                        href="/docs/agents"
                        className="group p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Back to Agents →</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Review specialist agents
                        </p>
                    </Link>
                </div>
            </section>

            {/* Footer Navigation */}
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <Link
                    href="/docs/skills"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:underline flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Skills
                </Link>
                <Link
                    href="/docs/cli"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:underline flex items-center gap-1"
                >
                    CLI Reference
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
