// utils/llm.js - Multi-provider LLM router (Claude Opus 5.5 + GPT-6 Astra)
//
// Both providers are asked for the same JSON-schema-constrained output, so callers
// get one shape back no matter which model answered. Providers are tried in
// LLM_PROVIDER_ORDER; a failure, timeout, refusal, or truncated answer on one
// falls through to the next. When every provider fails, generateJSON throws and the
// caller falls back to its own rule-based output.
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

const DEFAULTS = {
    anthropicModel: 'claude-opus-5-5',
    openaiModel: 'gpt-6-astra',
    // Opus 5.5 defaults to 'medium' effort when unset; set it explicitly so behavior
    // doesn't drift if the API default changes.
    effort: 'medium',
    timeoutMs: 90000,
    maxOutputTokens: 16000
};

class LLMRouter {
    constructor() {
        this.providers = {};
        this.order = [];
    }

    initialize() {
        const timeout = parseInt(process.env.LLM_TIMEOUT_MS, 10) || DEFAULTS.timeoutMs;

        if (process.env.ANTHROPIC_API_KEY) {
            this.providers.anthropic = {
                client: new Anthropic({ timeout, maxRetries: 1 }),
                model: process.env.ANTHROPIC_MODEL || DEFAULTS.anthropicModel,
                effort: process.env.ANTHROPIC_EFFORT || DEFAULTS.effort
            };
        }

        if (process.env.OPENAI_API_KEY) {
            this.providers.openai = {
                client: new OpenAI({ timeout, maxRetries: 1 }),
                model: process.env.OPENAI_MODEL || DEFAULTS.openaiModel,
                effort: process.env.OPENAI_REASONING_EFFORT || DEFAULTS.effort
            };
        }

        const requested = (process.env.LLM_PROVIDER_ORDER || 'anthropic,openai')
            .split(',')
            .map(p => p.trim().toLowerCase())
            .filter(Boolean);
        this.order = requested.filter(name => this.providers[name]);

        if (this.order.length === 0) {
            console.warn('⚠️  No LLM provider configured (set ANTHROPIC_API_KEY and/or OPENAI_API_KEY) - AI reports will use rule-based fallback');
        } else {
            console.log(`✅ LLM providers ready: ${this.order.map(n => `${n} (${this.providers[n].model})`).join(' → ')}`);
        }
    }

    get isConfigured() {
        return this.order.length > 0;
    }

    status() {
        return this.order.map(name => ({ provider: name, model: this.providers[name].model }));
    }

    /**
     * Generate a JSON object that conforms to `schema`.
     * @param {object} opts
     * @param {string} opts.system  Stable instructions (cached on Anthropic)
     * @param {string} opts.user    Per-request content
     * @param {object} opts.schema  JSON schema (additionalProperties:false, all props required)
     * @param {string} opts.schemaName  Identifier for the OpenAI schema
     */
    async generateJSON({ system, user, schema, schemaName }) {
        const errors = [];

        for (const name of this.order) {
            const started = Date.now();
            try {
                const result = name === 'anthropic'
                    ? await this._anthropic({ system, user, schema })
                    : await this._openai({ system, user, schema, schemaName });

                console.log(`🤖 ${name} (${result.model}) answered in ${Date.now() - started}ms`);
                return { ...result, provider: name };
            } catch (error) {
                console.warn(`⚠️  ${name} failed after ${Date.now() - started}ms: ${error.message}`);
                errors.push(`${name}: ${error.message}`);
            }
        }

        throw new Error(`All LLM providers failed (${errors.join('; ') || 'none configured'})`);
    }

    async _anthropic({ system, user, schema }) {
        const { client, model, effort } = this.providers.anthropic;

        // Opus 5.5: thinking is always on (adaptive) and effort is the only control;
        // sending thinking:{type:"disabled"} or budget_tokens would 400.
        const response = await client.messages.create({
            model,
            max_tokens: DEFAULTS.maxOutputTokens,
            system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
            messages: [{ role: 'user', content: user }],
            output_config: {
                effort,
                format: { type: 'json_schema', schema }
            }
        });

        if (response.stop_reason === 'refusal') {
            throw new Error(`refused (${response.stop_details?.category || 'unspecified'})`);
        }
        if (response.stop_reason === 'max_tokens') {
            throw new Error('output truncated at max_tokens');
        }

        const text = response.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('');

        return {
            data: JSON.parse(text),
            model: response.model,
            usage: {
                input: response.usage.input_tokens,
                output: response.usage.output_tokens,
                cacheRead: response.usage.cache_read_input_tokens || 0
            }
        };
    }

    async _openai({ system, user, schema, schemaName }) {
        const { client, model, effort } = this.providers.openai;

        const response = await client.responses.create({
            model,
            instructions: system,
            input: user,
            reasoning: { effort },
            max_output_tokens: DEFAULTS.maxOutputTokens,
            text: {
                format: {
                    type: 'json_schema',
                    name: schemaName,
                    schema,
                    strict: true
                }
            }
        });

        if (response.status === 'incomplete') {
            throw new Error(`incomplete response (${response.incomplete_details?.reason || 'unknown'})`);
        }
        if (!response.output_text) {
            throw new Error('empty response');
        }

        return {
            data: JSON.parse(response.output_text),
            model: response.model,
            usage: {
                input: response.usage?.input_tokens,
                output: response.usage?.output_tokens,
                cacheRead: response.usage?.input_tokens_details?.cached_tokens || 0
            }
        };
    }
}

module.exports = new LLMRouter();
