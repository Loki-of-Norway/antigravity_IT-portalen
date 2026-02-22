import Link from "next/link";

export default function SkillsPage() {
    return (
        <div className="max-w-3xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                <Link href="/docs" className="hover:text-zinc-900 dark:hover:text-zinc-50">Docs</Link>
                <span>/</span>
                <span className="text-zinc-900 dark:text-zinc-50">Skills</span>
            </nav>

            {/* Page Header */}
            <div className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    Skills
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                    Domain-specific knowledge modules that agents load automatically.
                </p>
            </div>

            {/* What are Skills */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    What are Skills?
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-4">
                    Skills are modular knowledge packages that contain principles, patterns, and decision-making frameworks for specific domains. They're loaded automatically when an agent needs them.
                </p>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">
                    Unlike hard-coded templates, skills teach <em>principles</em> — enabling agents to make contextual decisions rather than copying patterns.
                </p>

                <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                        <strong className="font-semibold">Key Principle:</strong> Skills are loaded on-demand based on task context. You don't need to configure anything manually.
                    </p>
                </div>
            </section>

            {/* How Skills Work */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    How Skills Work
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">
                    When you invoke an agent, it automatically loads relevant skills based on:
                </p>

                <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3 text-base text-zinc-600 dark:text-zinc-400">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-bold shrink-0 mt-0.5">1</span>
                        <div>
                            <strong className="font-semibold text-zinc-900 dark:text-zinc-50">Agent Configuration</strong>
                            <p className="text-sm mt-1">Each agent specifies which skills it can access in its frontmatter</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 text-base text-zinc-600 dark:text-zinc-400">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-bold shrink-0 mt-0.5">2</span>
                        <div>
                            <strong className="font-semibold text-zinc-900 dark:text-zinc-50">Task Context</strong>
                            <p className="text-sm mt-1">The AI reads skill descriptions and loads relevant ones</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 text-base text-zinc-600 dark:text-zinc-400">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-bold shrink-0 mt-0.5">3</span>
                        <div>
                            <strong className="font-semibold text-zinc-900 dark:text-zinc-50">Selective Reading</strong>
                            <p className="text-sm mt-1">Only necessary sections are read to optimize context usage</p>
                        </div>
                    </li>
                </ul>
            </section>

            {/* Skill Categories */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    Skill Categories
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">
                    40+ skills organized by domain:
                </p>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Frontend Development</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">react-patterns</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Modern React patterns and hooks</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">nextjs-best-practices</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Next.js App Router principles</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">tailwind-patterns</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Tailwind CSS v4 principles</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">frontend-design</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">UI/UX design thinking</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Backend Development</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">api-patterns</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">API design decisions</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">database-design</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Schema and indexing strategy</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">nodejs-best-practices</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Node.js development principles</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">docker-expert</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Container optimization</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Quality & Testing</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">testing-patterns</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Testing strategies and mocking</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">vulnerability-scanner</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Security analysis</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">systematic-debugging</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">4-phase debugging methodology</p>
                            </div>
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50 font-semibold">clean-code</code>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Pragmatic coding standards</p>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-6">
                    And 28+ more skills covering architecture, deployment, SEO, mobile, game development, and specialized tools.
                </p>
            </section>

            {/* Skill Structure */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    Skill Structure
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">
                    Each skill contains:
                </p>

                <div className="relative group mb-6">
                    <pre className="p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950 overflow-x-auto border border-zinc-800 font-mono text-sm">
                        <code className="text-zinc-100">{`skills/
└── react-patterns/
    ├── SKILL.md         # Main documentation
    ├── sections/        # Detailed guides
    ├── examples/        # Reference implementations
    └── scripts/         # Helper utilities (optional)`}</code>
                    </pre>
                </div>
            </section>

            {/* Next Steps */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                    Next Steps
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/docs/workflows"
                        className="group p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Workflows →</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Learn about slash command procedures
                        </p>
                    </Link>
                    <Link
                        href="/docs/cli"
                        className="group p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">CLI Reference →</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Explore command-line tools
                        </p>
                    </Link>
                </div>
            </section>

            {/* Footer Navigation */}
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <Link
                    href="/docs/agents"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:underline flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Agents
                </Link>
                <Link
                    href="/docs/workflows"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:underline flex items-center gap-1"
                >
                    Workflows
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
