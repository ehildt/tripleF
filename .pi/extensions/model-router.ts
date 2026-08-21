/**
 * model-router.ts — deterministic model-routing backstop for the 3F workbench.
 *
 * Why this exists: `pi-model-switch` routing is prompt-driven. Switching *to*
 * the implementer works reliably (sharp trigger: explicit user go-ahead,
 * executed by the planner model), but switching *back* to the planner is left
 * to the implementer model (deepseek-v4-flash), which frequently fails to
 * initiate it when the user follows up with questions. This extension makes
 * the reset deterministic: whenever a new user prompt arrives while the
 * implementer model is active, the model is reset to the Planner before the
 * agent runs. The planner then re-switches to the implementer on explicit
 * go-ahead — the path that already works.
 *
 * `before_agent_start` fires once per user prompt, before the agent loop, so
 * this never interrupts a tool loop mid-implementation.
 *
 * Aliases are read from the same sources APPEND_SYSTEM.md documents:
 *   1. ~/.pi/agent/npm/node_modules/pi-model-switch/aliases.json
 *   2. ~/.pi/agent/model-switch-aliases.json (backup)
 *   3. compiled-in defaults
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type AliasConfig = Record<string, string | string[]>;

const DEFAULT_ALIASES: AliasConfig = {
	plan: "ollama-cloud/kimi-k3:cloud",
	implement: "ollama-cloud/deepseek-v4-flash:0731-cloud",
};

const ALIAS_SOURCES = [
	join(homedir(), ".pi/agent/npm/node_modules/pi-model-switch/aliases.json"),
	join(homedir(), ".pi/agent/model-switch-aliases.json"),
];

function parseModelSpec(spec: string): { provider: string; modelId: string } | null {
	const normalized = spec.trim();
	const slashIndex = normalized.indexOf("/");
	if (slashIndex <= 0 || slashIndex >= normalized.length - 1) {
		return null;
	}
	const provider = normalized.slice(0, slashIndex).trim();
	const modelId = normalized.slice(slashIndex + 1).trim();
	return provider && modelId ? { provider, modelId } : null;
}

function loadAliases(): AliasConfig {
	for (const source of ALIAS_SOURCES) {
		if (!existsSync(source)) {
			continue;
		}
		try {
			const parsed = JSON.parse(readFileSync(source, "utf-8"));
			if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
				continue;
			}
			const aliases: AliasConfig = {};
			for (const [rawKey, rawValue] of Object.entries(parsed)) {
				const key = rawKey.trim();
				if (!key) {
					continue;
				}
				const values: string[] = [];
				for (const candidate of Array.isArray(rawValue) ? rawValue : [rawValue]) {
					if (typeof candidate !== "string") {
						continue;
					}
					const value = candidate.trim();
					if (parseModelSpec(value)) {
						values.push(value);
					}
				}
				if (values.length > 0) {
					aliases[key] = values.length === 1 ? values[0] : values;
				}
			}
			if (aliases.plan || aliases.implement) {
				return aliases;
			}
		} catch {
			// Malformed file — fall through to the next source.
		}
	}
	return DEFAULT_ALIASES;
}

function aliasTargets(aliases: AliasConfig, name: string): string[] {
	const value = aliases[name];
	if (!value) {
		return [];
	}
	return (Array.isArray(value) ? value : [value]).map((spec) => spec.trim());
}

function matchesModel(spec: string, provider: string, id: string): boolean {
	const parsed = parseModelSpec(spec);
	return (
		parsed !== null
		&& parsed.provider.toLowerCase() === provider.toLowerCase()
		&& parsed.modelId.toLowerCase() === id.toLowerCase()
	);
}

export default function modelRouter(pi: ExtensionAPI) {
	const aliases = loadAliases();
	const implementerTargets = aliasTargets(aliases, "implement");
	const plannerTargets = aliasTargets(aliases, "plan");

	pi.on("before_agent_start", async (_event, ctx) => {
		const current = ctx.model;
		if (!current) {
			return;
		}

		// Only act when the implementer model is active.
		const isImplementer = implementerTargets.some((spec) => matchesModel(spec, current.provider, current.id));
		if (!isImplementer) {
			return;
		}

		// Resolve the planner model from the available registry (fallback chain).
		const available = ctx.modelRegistry.getAvailable();
		const planner = plannerTargets
			.map((spec) => {
				const parsed = parseModelSpec(spec);
				if (!parsed) {
					return undefined;
				}
				return available.find(
					(model) =>
						model.provider.toLowerCase() === parsed.provider.toLowerCase()
						&& model.id.toLowerCase() === parsed.modelId.toLowerCase(),
				);
			})
			.find((model) => model !== undefined);

		if (!planner) {
			ctx.ui.notify("model-router: planner model not available; keeping current model", "warning");
			return;
		}

		if (planner.provider === current.provider && planner.id === current.id) {
			return;
		}

		const success = await pi.setModel(planner);
		if (success) {
			ctx.ui.notify(`Model reset to planner (${planner.provider}/${planner.id})`, "info");
		} else {
			ctx.ui.notify("model-router: failed to reset to planner model", "error");
		}
	});
}
