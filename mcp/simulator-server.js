#!/usr/bin/env node
/**
 * MCP Server: Student & Task Response Simulator for IT-portalen
 * 
 * Implements Model Context Protocol (MCP) stdio server to generate test students,
 * simulated quiz/task answers, support tickets, and feedback.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const core = require('./simulator-core.js');

// Create MCP Server instance
const server = new Server(
    {
        name: 'student-task-simulator',
        version: '1.0.0'
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// Define tool schemas
const TOOLS = [
    {
        name: 'create_test_students',
        description: 'Oppretter eller oppdaterer et sett med realistiske norske testelever i databasen med elev-rolle og standard passord.',
        inputSchema: {
            type: 'object',
            properties: {
                count: {
                    type: 'number',
                    description: 'Antall elever å opprette (1 - 12, standard: 8)'
                },
                prefix: {
                    type: 'string',
                    description: 'Brukernavn-prefiks (standard: "elev")'
                },
                defaultPassword: {
                    type: 'string',
                    description: 'Standard passord for elevene (standard: "Passord123!")'
                }
            }
        }
    },
    {
        name: 'simulate_task_responses',
        description: 'Genererer tilfeldige eller realistiske oppgave- og quizbesvarelser for alle registrerte testelever, inkludert kursprogresjon og tidsstempler.',
        inputSchema: {
            type: 'object',
            properties: {
                mode: {
                    type: 'string',
                    enum: ['random', 'realistic', 'high_performing', 'struggling'],
                    description: 'Svar-modus: "random" (helt vilkårlig), "realistic" (variert klasse med flinke og svake), "high_performing" (80-100%), "struggling" (20-50%). Standard: "realistic".'
                },
                attemptsPerStudent: {
                    type: 'number',
                    description: 'Maks antall forsøk per elev per kurs (standard: 3)'
                },
                courses: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Liste over kurser (f.eks. ["intro-coding", "pc-basics", "datasikkerhet"])'
                }
            }
        }
    },
    {
        name: 'simulate_tickets',
        description: 'Genererer realistiske IT-brukerstøttesaker (tickets) sendt inn fra elevene for testing av sakshåndtering og SLA i adminpanelet.',
        inputSchema: {
            type: 'object',
            properties: {
                count: {
                    type: 'number',
                    description: 'Antall saker å opprette (standard: 6)'
                }
            }
        }
    },
    {
        name: 'simulate_feedback',
        description: 'Genererer vurderinger og tilbakemeldinger (stjernerangeringer og kommentarer) fra elevene.',
        inputSchema: {
            type: 'object',
            properties: {
                count: {
                    type: 'number',
                    description: 'Antall tilbakemeldinger å opprette (standard: 5)'
                }
            }
        }
    },
    {
        name: 'run_full_simulation',
        description: 'Kjører en komplett simulering: oppretter elever, genererer oppgavebesvarelser, tickets og vurderinger i en operasjon.',
        inputSchema: {
            type: 'object',
            properties: {
                studentCount: {
                    type: 'number',
                    description: 'Antall elever (standard: 8)'
                },
                responseMode: {
                    type: 'string',
                    enum: ['random', 'realistic', 'high_performing', 'struggling'],
                    description: 'Svar-modus for oppgavene (standard: "realistic")'
                },
                attemptsPerStudent: {
                    type: 'number',
                    description: 'Forsøk per kurs (standard: 3)'
                }
            }
        }
    },
    {
        name: 'clear_test_data',
        description: 'Fjerner alle genererte testelever og alle deres tilhørende oppgavebesvarelser, quizer, tickets og tilbakemeldinger.',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'get_simulation_summary',
        description: 'Henter gjeldende statistikk over testelever, quiz-besvarelser, snittkarakter, fullføringsgrad og tickets i databasen.',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    }
];

// Handle listing tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});

// Handle executing tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
        let result;
        switch (name) {
            case 'create_test_students':
                result = await core.createTestStudents(args);
                break;
            case 'simulate_task_responses':
                result = await core.simulateTaskResponses(args);
                break;
            case 'simulate_tickets':
                result = await core.simulateTickets(args);
                break;
            case 'simulate_feedback':
                result = await core.simulateFeedback(args);
                break;
            case 'run_full_simulation':
                result = await core.runFullSimulation(args);
                break;
            case 'clear_test_data':
                result = await core.clearTestData();
                break;
            case 'get_simulation_summary':
                result = await core.getSimulationSummary();
                break;
            default:
                throw new Error(`Ukjent verktøy: ${name}`);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Feil under kjøring av verktøy '${name}': ${error.message}`
                }
            ]
        };
    }
});

/**
 * CLI runner support when invoked directly via node
 */
async function handleCLI() {
    const args = process.argv.slice(2);
    if (args.includes('--run') || args.includes('-r')) {
        console.log('🚀 Kjører full simulering via CLI...');
        const res = await core.runFullSimulation();
        console.log('Resultat:', JSON.stringify(res, null, 2));
        process.exit(0);
    } else if (args.includes('--clear') || args.includes('-c')) {
        console.log('🧹 Sletter testdata via CLI...');
        const res = await core.clearTestData();
        console.log('Resultat:', JSON.stringify(res, null, 2));
        process.exit(0);
    } else if (args.includes('--status') || args.includes('-s')) {
        console.log('📊 Henter databaseoversikt...');
        const res = await core.getSimulationSummary();
        console.log('Oversikt:', JSON.stringify(res, null, 2));
        process.exit(0);
    }
}

// Start MCP Server
async function main() {
    // If CLI arguments were passed, run CLI mode instead of stdio MCP
    if (process.argv.length > 2) {
        await handleCLI();
        return;
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Loki IT-portalen MCP Student Simulator Server running on stdio');
}

main().catch(err => {
    console.error('Fatal MCP Server error:', err);
    process.exit(1);
});
