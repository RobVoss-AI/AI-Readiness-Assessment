const test = require('node:test');
const assert = require('node:assert');

const RoiCalculator = require('../client/roi-calculator');
const { scoreLead } = require('../utils/leadScoring');
const { REPORT_SCHEMA, buildRuleBasedReport, generateReport } = require('../utils/aiReport');
const llm = require('../utils/llm');

// Minimal validator for the JSON-schema subset used by REPORT_SCHEMA
function validate(schema, value, path = '$') {
    if (schema.enum) assert.ok(schema.enum.includes(value), `${path} not in enum: ${value}`);
    switch (schema.type) {
        case 'object':
            assert.strictEqual(typeof value, 'object', `${path} should be an object`);
            assert.deepStrictEqual(Object.keys(value).sort(), [...schema.required].sort(), `${path} keys`);
            for (const key of schema.required) validate(schema.properties[key], value[key], `${path}.${key}`);
            break;
        case 'array':
            assert.ok(Array.isArray(value), `${path} should be an array`);
            value.forEach((item, i) => validate(schema.items, item, `${path}[${i}]`));
            break;
        case 'string':
            assert.strictEqual(typeof value, 'string', `${path} should be a string`);
            break;
        case 'number':
            assert.ok(Number.isFinite(value), `${path} should be a number`);
            break;
        case 'integer':
            assert.ok(Number.isInteger(value), `${path} should be an integer`);
            break;
    }
}

const scores = { strategy: 70, operations: 55, technology: 80, data: 40, culture: 65, automation: 35, governance: 25 };

test('report schema is strict-mode compatible (every object closed, every property required)', () => {
    (function walk(schema) {
        if (schema.type === 'object') {
            assert.strictEqual(schema.additionalProperties, false);
            assert.deepStrictEqual([...schema.required].sort(), Object.keys(schema.properties).sort());
            Object.values(schema.properties).forEach(walk);
        } else if (schema.type === 'array') {
            walk(schema.items);
        }
    })(REPORT_SCHEMA);
});

test('rule-based report matches the LLM schema', () => {
    const roi = RoiCalculator.calculate({ readiness: 53, orgSize: '51-200' });
    const report = buildRuleBasedReport({ scores, overall: 53, profile: { industry: 'Education' }, roi });
    validate(REPORT_SCHEMA, report);
    assert.strictEqual(report.use_cases.length, 3);
    assert.strictEqual(report.consultant_brief.engagement_fit, 'governance_sprint');
});

test('generateReport falls back to rules when no provider is configured', async () => {
    const result = await generateReport({ scores, profile: { industry: 'Finance & Banking', orgSize: '11-50' } });
    assert.strictEqual(result.source.provider, 'rules');
    assert.strictEqual(result.overall, 53);
    validate(REPORT_SCHEMA, result.report);
});

test('LLM router fails over to the next provider', async () => {
    llm.providers = { anthropic: { model: 'claude-opus-5-5' }, openai: { model: 'gpt-6-astra' } };
    llm.order = ['anthropic', 'openai'];
    llm._anthropic = async () => { throw new Error('overloaded'); };
    llm._openai = async () => ({ data: { ok: true }, model: 'gpt-6-astra', usage: {} });

    const result = await llm.generateJSON({ system: 's', user: 'u', schema: {}, schemaName: 'x' });
    assert.strictEqual(result.provider, 'openai');
    assert.deepStrictEqual(result.data, { ok: true });

    llm._openai = async () => { throw new Error('timeout'); };
    await assert.rejects(llm.generateJSON({ system: 's', user: 'u', schema: {}, schemaName: 'x' }), /All LLM providers failed/);

    llm.providers = {};
    llm.order = [];
});

test('ROI grows with readiness and respects org size', () => {
    const low = RoiCalculator.calculate({ readiness: 20, orgSize: '51-200' });
    const high = RoiCalculator.calculate({ readiness: 90, orgSize: '51-200' });
    assert.strictEqual(low.inputs.employees, 125);
    assert.ok(high.current.annualHours > low.current.annualHours);
    assert.ok(low.unlockableValue > 0);
    assert.strictEqual(high.unlockableValue, 0);
});

test('ROI clamps bad input to defaults', () => {
    const roi = RoiCalculator.calculate({ readiness: 50, employees: 'abc', hourlyCost: -5, adoptionRate: 9 });
    assert.strictEqual(roi.inputs.employees, 30);
    assert.strictEqual(roi.inputs.hourlyCost, 1);
    assert.strictEqual(roi.inputs.adoptionRate, 1);
});

test('lead scoring favors real opportunity over readiness', () => {
    const bigExecWithGaps = scoreLead({
        overall: 40, orgSize: '201-1000', role: 'Executive',
        answers: { strategy_budget: 3, strategy_leadership: 4 },
        freeResponses: { strategy_open: 'We need to protect client data before rolling out AI tools.' }
    });
    const tinyAdvanced = scoreLead({ overall: 90, orgSize: '1-10', role: 'Team Member' });

    assert.ok(bigExecWithGaps.priority > tinyAdvanced.priority);
    assert.strictEqual(bigExecWithGaps.qualified, true);
    assert.strictEqual(tinyAdvanced.qualified, false);
    assert.ok(bigExecWithGaps.estimatedDealValue > tinyAdvanced.estimatedDealValue);
});
